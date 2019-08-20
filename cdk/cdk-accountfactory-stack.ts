import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');
import iam = require('@aws-cdk/aws-iam');
import cfn = require('@aws-cdk/aws-cloudformation');

export class CdkAccountfactoryStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

     // The code that defines your stack goes here

    const paramAcctName = new cdk.CfnParameter(this, 'AccountName', {
      default: this.node.tryGetContext('AccountName'),
      type: "String",
    })
    
    const paramBucketName = new cdk.CfnParameter(this, 'bucketName', {
      default: this.node.tryGetContext('bucketName'),
      type: "String",
    })
    
    const paramEmail = new cdk.CfnParameter(this, 'Email', {
      default: this.node.tryGetContext('Email'),
      type: "String",
    })
    
    const paramOUName = new cdk.CfnParameter(this, 'OUName', {
      default: this.node.tryGetContext('OUName'),
      type: "String",
    })
    
    const cidrParam = new cdk.CfnParameter(this, 'cidrParam', {
      default: "10.0.0.0/21",
      type: "String",
    })
    
    const publicSubnet1Param = new cdk.CfnParameter(this, 'publicSubnet1Param', {
      default: "10.0.0.0/24",
      type: "String",
    })
    
    const publicSubnet2Param = new cdk.CfnParameter(this, 'publicSubnet2Param', {
      default: "10.0.1.0/24",
      type: "String",
    })
    
    const privateSubnet1Param = new cdk.CfnParameter(this, 'privateSubnet1Param', {
      default: "10.0.2.0/24",
      type: "String",
    })
    
    const privateSubnet2Param = new cdk.CfnParameter(this, 'privateSubnet2Param', {
      default: "10.0.3.0/24",
      type: "String",
    })

    const bucket = s3.Bucket.fromBucketName(this,'123',paramBucketName);

     const lambdaProvider = new lambda.SingletonFunction(this, 'Singleton', {
              uuid: 'f7d4f730-4ee1-11e8-9c2d-fa7ae01bbebc',
              code: lambda.Code.bucket( bucket, 'accountfactory/index.py.zip'),
              handler: 'index.main',
              timeout: cdk.Duration.seconds(900),
              environment: {
                'AccountName': paramAcctName,
                'OUName': paramOUName,
                'Email': paramEmail,
                'bucketName': paramBucketName
                'cidrParam' : cidrParam
                'publicSubnet1Param' : publicSubnet1Param
                'publicSubnet2Param' : publicSubnet2Param
                'privateSubnet1Param' : privateSubnet1Param
                'privateSubnet2Param' : privateSubnet2Param
              },
              runtime: lambda.Runtime.PYTHON_2_7
            });
            
      lambdaProvider.addToRolePolicy(new iam.PolicyStatement({
      resources: ['*'],
      effect: iam.Effect.ALLOW,
      actions:['organizations:*'] }));
      
      lambdaProvider.addToRolePolicy(new iam.PolicyStatement({
      resources: ['*'],
      effect: iam.Effect.ALLOW,
      actions:['sts:AssumeRole'] }));
      
      const resource = new cfn.CustomResource(this, 'Resource', {
        provider: cfn.CustomResourceProvider.lambda(lambdaProvider)
    });
  }
}
