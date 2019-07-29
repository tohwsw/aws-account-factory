# AWS Account Factory

## Overview

As an organization expands its use of AWS services, there is a need to create multiple AWS accounts to ensure separation of business processes or for security, compliance, and billing. Many of the customers we work with use separate AWS accounts for each business unit so they can meet the different needs of their organization. Creating multiple accounts has simplified operational issues and provided benefits like security and resource isolation, a smaller blast radius, and simplified billing. Often it takes a lot of time to create, bootstrap and configure baseline settings. 

Customers want to manage account creation and bootstrapping in a scalable and efficient manner so that new accounts are created with a defined baseline and some governance guardrails are in place. Most importantly, customers want automation, to save time and resources.

There are already 2 AWS solutions to quickly set up a secure, multi-account AWS environment based on AWS best practices. They are as follow:

https://aws.amazon.com/solutions/aws-landing-zone/
https://aws.amazon.com/controltower/

However, the solutions above currently can only be applied to new accounts. The source code is also not available, so the solution cannot be augmented easily eg. taking away or replacing the SSO component.

This repository contains the code to create an account vending machine (AVM) that can be applied into an existing AWS master account. Customers and partners of AWS can make use of this. If necessary augment it to include the guardrails required.

An AVM will help you with the following:
- Providing a user interface to provision new organization units and accounts
- Create a new Amazon VPC in the new account
- Lay down the account baseline including governance guardrails

The tenets for the AVM are:
- AVM follows the Middle Path to creating a landing zone. It seeks to be a efficient yet simple to maintain solution.
- AVM will be able to be applied to existing as well as new accounts.

## Solution Architecture

The account builder is an AWS Service Catalog product that uses AWS Lambda and AWS Organizations APIs to create AWS accounts. On each invocation, the AWS Lambda function used in this sample solution does the following:
1)Check if organization unit already exist, else create an organization unit under the root account in AWS Organizations
2)Creates a new AWS account.
3)Moves the newly created account from the organization root to the newly created organizational unit.
4)Assumes the role OrganizationAccountAccessRole in the new account for the following:
    - Deleting the default VPCs in all AWS Regions.
    - Deploying a custom VPC using the provided parameters.
    - Deploying the guardrails of AWS CloudTrail, AWS GuardDuty and AWS Config.

This approach of bootstrapping accounts will reduce operational overhead and standardize account configurations across the provisioned AWS accounts. The following architecture outlines the process flow involved with account building :

![img1]

[img1]:https://github.com/tohwsw/aws-account-factory/blob/master/img/accountfactory.png

## Step 1

Create the folder accountfactory in your preferred S3 bucket. Upload the baseline templates in the baseline folder and index.py.zip(this contains the Lambda function) to your preferred S3 bucket.

## Step 2

Create a AWS Service Catalog with CloudFormation script CdkAccountfactoryStack.template.json in your master account.

## Step 3

Launch the product via AWS Service Catalog and log into the newly created AWS account by using the switch role function.

## CDK

The baseline templates and CdkAccountfactoryStack.template.json are created using AWS CDK. They are written in typescript and examples are uploaded into the CDK folder. The reference can be found in https://aws.amazon.com/cdk/



