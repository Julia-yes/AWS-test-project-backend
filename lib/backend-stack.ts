import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cdk from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import { frontendUrl } from "./handler";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsList = new lambda.Function(this, "lambda-function", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "handler.main",
      code: lambda.Code.fromAsset(path.join(__dirname, "./")),
    });

    const api = new apigateway.RestApi(this, "my-api", {
      restApiName: "My API Gateway",
      description: "This API serves the Lambda functions.",
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(
      getProductsList,
      {
        integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: {
              "application/json": "$input.body",
            },
          },
        ],
        proxy: false,
      }
    );
    const productResource = api.root.addResource("products");
    productResource.addMethod("GET", lambdaIntegration, {
      methodResponses: [
        {
          statusCode: "200",
        },
        {
          statusCode: "500",
        },
      ],
    });
    productResource.addCorsPreflight({
      allowOrigins: [frontendUrl],
      allowMethods: ["GET"],
    });
  }
}
