import cdk = require('@aws-cdk/core');
import guardduty = require('@aws-cdk/aws-guardduty');
import cloudtrail = require('@aws-cdk/aws-cloudtrail');
import config = require('@aws-cdk/aws-config');
import iam = require('@aws-cdk/aws-iam');
import ec2 = require('@aws-cdk/aws-ec2');

export class CdkBaselineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    if (props.task == 'guardduty') {
      //turn on guard duty. 
      const gd = new guardduty.CfnDetector(this,'myguardduty',{enable:true});
    }  
    else if (props.task == 'cloudtrail') {
      //enable cloudtrail in all available regions
      //You can instantiate the CloudTrail construct with no arguments - this will by default: 
      //* Create a new S3 Bucket and associated Policy that allows CloudTrail to write to it
      //* Create a CloudTrail with the following configuration: * Logging Enabled * Log file validation enabled * Multi Region set to true * Global Service Events set to true 
      //* The created S3 bucket * CloudWatch Logging Disabled * No SNS configuartion * No tags * No fixed name
      const trail = new cloudtrail.Trail( this, 'CloudTrail', {});
    } 
    else if (props.task == 'newvpc') {
      const vpc = new ec2.Vpc(this, 'TheVPC', {
        cidr: "10.0.0.0/21",
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'Ingress',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'Application',
            subnetType: ec2.SubnetType.PRIVATE,
          }
        ],
      });
    }
    else {
      // do others
    }
    
  }
}

const app = new cdk.App();

new CdkBaselineStack(app, "GuardDutyStack", {
    task: 'guardduty'
});

new CdkBaselineStack(app, "CloudTrailStack", {
    task: 'cloudtrail'
});

new CdkBaselineStack(app, "VPCStack", {
    task: 'newvpc'
});



    
    /*
    const myRole = new iam.Role( this, 'MyRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com')
    });
  
    myRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['*'] }));
    
    // Turn on config recorder and rules
    const myConfigRecorder = new config.CfnConfigurationRecorder(this,'myconfig',{
      roleArn:myRole.roleArn,
      name:'myConfigurationRecorder'
    });
    
    const configrule1 = new config.ManagedRule(this, 'AccessKeysRotated', {
      identifier: 'ACCESS_KEYS_ROTATED'
    });
    
    const deliverychannel =new config.CfnDeliveryChannel(this, 'mychannel',{s3BucketName:'waynetohpublic'})
    
   deliverychannel.addDependsOn(myConfigRecorder);
   
   */

