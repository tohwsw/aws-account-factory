#Import modules
import json, boto3, logging, os, time
from botocore.vendored import requests

#Define logging properties
log = logging.getLogger()
log.setLevel(logging.INFO)

def respond_cfn(event, status, data=None):
    responseBody = {
        'Status': status,
        'Reason': 'See the details in CloudWatch Log Stream',
        'PhysicalResourceId': event['ServiceToken'],
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'Data': data
    }

    print('Response = ' + json.dumps(responseBody))
    print(event)
    requests.put(event['ResponseURL'], data=json.dumps(responseBody))

def assume_role(account_id, account_role):
    sts_client = boto3.client('sts',
                   endpoint_url='https://sts.ap-southeast-1.amazonaws.com')
    role_arn = 'arn:aws:iam::' + account_id + ':role/' + account_role

    assumedRoleObject = sts_client.assume_role(
        RoleArn=role_arn,
        RoleSessionName="NewAccountRole"
    )

    return assumedRoleObject['Credentials']

def create_account():
    
    #Initialisation of variables
    client = boto3.client('organizations')
    list_of_OU_ids = []
    list_of_OU_names = []
    newAccountId ='None'
    ouId='None'
    rootId=client.list_roots().get('Roots')[0].get('Id')

    #Read and log the input values
    acctName = os.environ['AccountName']
    ouName = os.environ['OUName']
    emailAddress = os.environ['Email']
    log.info("Account name is: " + acctName)
    log.info("Organizational Unit name is: " + ouName)
    log.info("Email Address is: " + emailAddress)
    
    #Check if ou has been created
    list_of_OUs_response = client.list_organizational_units_for_parent(ParentId=rootId)
    
    for i in list_of_OUs_response['OrganizationalUnits']:
        list_of_OU_ids.append(i['Id'])
        list_of_OU_names.append(i['Name'])
        if(i['Name'] == ouName):
            log.info("The provided Organization Unit already exist")
            ouId=i['Id']
    
    if(ouName not in list_of_OU_names):
        log.info("The provided Organization Unit Name doesnt exist. Creating an OU named: {}".format(ouName))
        ou_creation_response = client.create_organizational_unit(ParentId=rootId,Name=ouName)
        ouId = ou_creation_response['OrganizationalUnit']['Id']


    #Create the account
    acctResponse = client.create_account(
        Email=emailAddress,
        AccountName=acctName,
        RoleName='OrganizationAccountAccessRole'
    )

    #Check Account Status
    acctStatusID = acctResponse['CreateAccountStatus']['Id']
    log.info(acctStatusID)

    createStatus = client.describe_create_account_status(CreateAccountRequestId=acctStatusID)
    newAccountId = createStatus.get('CreateAccountStatus').get('AccountId')  
    while(newAccountId is None):
        log.info("Account creation in progress")
        time.sleep(5)
        createStatus = client.describe_create_account_status(CreateAccountRequestId=acctStatusID)
        newAccountId = createStatus.get('CreateAccountStatus').get('AccountId')
    
    log.info("New Account Id is " + newAccountId)

    #Move Account to new OU
    moveResponse = client.move_account(
        AccountId=newAccountId,
        SourceParentId=client.list_roots().get('Roots')[0].get('Id'),
        DestinationParentId=ouId
    )

    return newAccountId

def get_template(sourcebucket,baselinetemplate):

    s3 = boto3.resource('s3')
    content_object = s3.Object(sourcebucket,baselinetemplate)
    obj = content_object.get()['Body'].read().decode('utf-8') 
    return obj


def create_baseline(template,baselineStackName,credentials):
    log.info(credentials['AccessKeyId'])
    log.info(credentials['SecretAccessKey'])
    client = boto3.client('cloudformation',
                        region_name="ap-southeast-1",
                        aws_access_key_id=credentials['AccessKeyId'],
                          aws_secret_access_key=credentials['SecretAccessKey'],
                          aws_session_token = credentials['SessionToken']
                          )
                          
    print("Creating stack")
    create_stack_response = client.create_stack(
                    StackName=baselineStackName,
                    TemplateBody=template,
                    Capabilities=[
                        'CAPABILITY_NAMED_IAM'
                    ]
                )

def create_vpcbaseline(template,baselineStackName,credentials):
    log.info(credentials['AccessKeyId'])
    log.info(credentials['SecretAccessKey'])
    client = boto3.client('cloudformation',
                        region_name="ap-southeast-1",
                        aws_access_key_id=credentials['AccessKeyId'],
                          aws_secret_access_key=credentials['SecretAccessKey'],
                          aws_session_token = credentials['SessionToken']
                          )

    cidrParam = os.environ['cidrParam']
    publicSubnet1Param = os.environ['publicSubnet1Param']
    publicSubnet2Param = os.environ['publicSubnet2Param']
    privateSubnet1Param = os.environ['privateSubnet1Param']
    privateSubnet2Param = os.environ['privateSubnet2Param']

                          
    print("Creating stack")
    create_stack_response = client.create_stack(
                    StackName=baselineStackName,
                    TemplateBody=template,
                    Parameters=[
                        {
                            'ParameterKey': 'cidrParam',
                            'ParameterValue': cidrParam
                        },
                        {
                            'ParameterKey': 'publicSubnet1Param',
                            'ParameterValue': publicSubnet1Param
                        },
                        {
                            'ParameterKey': 'publicSubnet2Param',
                            'ParameterValue': publicSubnet2Param
                        },
                        {
                            'ParameterKey': 'privateSubnet1Param',
                            'ParameterValue': privateSubnet1Param
                        },
                        {
                            'ParameterKey': 'privateSubnet2Param',
                            'ParameterValue': privateSubnet2Param
                        }
                    ]
                )

#Main Lambda function to be executed
def main(event, context):
    #Initialize the status of the function

        try:
            #Create a new Account in the OU Just Created
            newAccountId = create_account()
            print("Waiting for account preparation")
            time.sleep(60)
    
            #Go into the new account
            credentials=assume_role(newAccountId,'OrganizationAccountAccessRole')
            
            #Apply baselines

            bucketName = os.environ['bucketName']
            template = get_template(bucketName,'accountfactory/CloudTrailStack.template.json')
            create_baseline(template,'cloudtrailbaseline',credentials)
            template = get_template(bucketName,'accountfactory/ConfigStack.template.json')
            create_baseline(template,'configbaseline',credentials)
            template = get_template(bucketName,'accountfactory/GuardDutyStack.template.json')
            create_baseline(template,'guarddutybaseline',credentials)
            template = get_template(bucketName,'accountfactory/VPCStack.template.json')
            create_baseline(template,'vpcbaseline',credentials)

            
            respond_cfn(event,"SUCCESS",{"Message":"Account created successfully"})
            return
        except Exception:
            respond_cfn(event,"FAILED",{"Message":"Account creation failed"})
            log.exception("Lambda execution has failed!")
            return

