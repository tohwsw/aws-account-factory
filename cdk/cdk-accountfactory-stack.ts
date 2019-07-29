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
