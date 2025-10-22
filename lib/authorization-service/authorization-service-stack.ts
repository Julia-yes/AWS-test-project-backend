


import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import { join } from "path";

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new lambda.Function(this, "BasicAuthorizerLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler.basicAuthorizer",
      code: lambda.Code.fromAsset(join(__dirname, "./")),
    });

  }
}
