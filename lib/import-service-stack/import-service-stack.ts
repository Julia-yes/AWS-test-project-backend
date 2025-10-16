

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3notifications from "aws-cdk-lib/aws-s3-notifications";
import { join } from "path";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Fn } from "aws-cdk-lib";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = new s3.Bucket(this, "ImportServiceBucket", {
      bucketName: `import-service-bucket-${this.account}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      "ImportedCatalogItemsQueue",
      Fn.importValue("CatalogItemsQueueArn")
    );
    new s3deploy.BucketDeployment(this, "CreateUploadedFolder", {
      destinationBucket: importBucket,
      destinationKeyPrefix: "uploaded/",
      sources: [s3deploy.Source.asset("./assets/uploaded")],
    });

    const importProductsFileFunction = new lambda.Function(
      this,
      "ImportProductsFileFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler.getUrl",
        memorySize: 1024,
        timeout: cdk.Duration.seconds(5),
        code: lambda.Code.fromAsset(join(__dirname, "./")),
        environment: {
          BUCKET_NAME: importBucket.bucketName,
        },
      }
    );

    importBucket.grantReadWrite(importProductsFileFunction);

    const api = new apigateway.RestApi(this, "ImportServiceAPI", {
      restApiName: "Import Service API",
    });

    const importResource = api.root.addResource("import");
    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileFunction),
      {}
    );

    const importFileParserFunction = new lambda.Function(
      this,
      "ImportFileParserFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handler.parser",
        memorySize: 1024,
        timeout: cdk.Duration.seconds(10),
        code: lambda.Code.fromAsset(join(__dirname, "./")),
        environment: {
          BUCKET_NAME: importBucket.bucketName,
          SQS_URL: catalogItemsQueue.queueUrl,
        },
      }
    );

    importBucket.grantRead(importFileParserFunction);

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3notifications.LambdaDestination(importFileParserFunction),
      {
        prefix: "uploaded/",
      }
    );

    catalogItemsQueue.grantSendMessages(importFileParserFunction);
  }
}
