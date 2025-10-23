import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { join } from "path";

const dotenv = require("dotenv");
dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizerLambdaArn: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const basicAuthorizerLambda = new lambda.Function(
      this,
      "basicAuthorizerLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler.basicAuthorizer",
        code: lambda.Code.fromAsset(join(__dirname, "lambdas")),
        environment: {
          GITHUB_LOGIN: process.env.GITHUB_LOGIN!,
          GITHUB_PASSWORD: process.env.GITHUB_PASSWORD!,
        },
      }
    );

    this.basicAuthorizerLambdaArn = basicAuthorizerLambda.functionArn;

    new cdk.CfnOutput(this, "BasicAuthorizerLambdaArnOutput", {
      value: this.basicAuthorizerLambdaArn,
      exportName: "BasicAuthorizerLambdaArn",
    });
  }
}
