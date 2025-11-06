
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from 'aws-cdk-lib';
import {  join } from 'path';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { CfnOutput } from "aws-cdk-lib";
import { aws_sns as sns, aws_sns_subscriptions as subs } from "aws-cdk-lib";

const testEmail = "echo@mail.ru";

const dotenv = require("dotenv");
dotenv.config();

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME;
const REGION = process.env.AWS_REGION;

if (!PRODUCTS_TABLE_NAME || !STOCK_TABLE_NAME || !REGION) {
  throw new Error(
    "Missing required environment variables. Please check your .env file."
  );
}

export class DatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "Products", {
      tableName: PRODUCTS_TABLE_NAME,
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const stockTable = new dynamodb.Table(this, "StockTable", {
      tableName: STOCK_TABLE_NAME,
      partitionKey: {
        name: "product_id",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "catalogItemsQueue",
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    const catalogBatchProcess = new lambda.Function(
      this,
      "CatalogBatchProcess",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "catalog-batch-process.catalogBatchProcess",
        code: lambda.Code.fromAsset(join(__dirname, "lambdas")),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      }
    );

    catalogBatchProcess.addEventSource(
      new SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      })
    );

    const createProductLambda = new lambda.Function(this, "lambda-function", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: "create-product.createProduct",
      code: lambda.Code.fromAsset(join(__dirname, "lambdas")),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });
    const getProductsListLambda = new lambda.Function(
      this,
      "GetProductsListFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 512,
        timeout: cdk.Duration.seconds(5),
        handler: "get-products-list.getProductsList",
        code: lambda.Code.fromAsset(join(__dirname, "lambdas")),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      }
    );

    const getProductByIdLambda = new lambda.Function(
      this,
      "GetProductByIdFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 512,
        timeout: cdk.Duration.seconds(5),
        handler: "get-product-by-id.getProductById",
        code: lambda.Code.fromAsset(join(__dirname, "lambdas")),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      }
    );

    new CfnOutput(this, "CatalogItemsQueueArn", {
      value: catalogItemsQueue.queueArn,
      exportName: "CatalogItemsQueueArn",
    });

    new CfnOutput(this, "CatalogItemsQueueUrl", {
      value: catalogItemsQueue.queueUrl,
      exportName: "CatalogItemsQueueUrl",
    });

    const getStockLambda = new lambda.Function(this, "GetStockFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      handler: "get-stock.getStock",
      code: lambda.Code.fromAsset(join(__dirname, "lambdas")),
      environment: {
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    const createProductTopic = new sns.Topic(this, "CreateProductTopic", {
      topicName: "createProductTopic",
    });

    createProductTopic.addSubscription(new subs.EmailSubscription(testEmail));

    catalogBatchProcess.addEnvironment(
      "SNS_TOPIC_ARN",
      createProductTopic.topicArn
    );

    createProductTopic.grantPublish(catalogBatchProcess);
    productsTable.grantWriteData(createProductLambda);
    productsTable.grantWriteData(catalogBatchProcess);
    stockTable.grantWriteData(createProductLambda);
    stockTable.grantWriteData(catalogBatchProcess);
    productsTable.grantReadData(getProductsListLambda);
    productsTable.grantReadData(getStockLambda);
    stockTable.grantReadData(getStockLambda);
    stockTable.grantReadData(getProductsListLambda);
    stockTable.grantReadData(getProductByIdLambda);

    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Products Service",
      description: "API for managing products and stock.",
    });

    const createProductIntegration = new apigateway.LambdaIntegration(
      createProductLambda
    );
    const getProductsListIntegration = new apigateway.LambdaIntegration(
      getProductsListLambda
    );
    const getProductByIdIntegration = new apigateway.LambdaIntegration(
      getProductByIdLambda
    );
    productsTable.grantReadData(getProductByIdLambda);

    const productsResource = api.root.addResource("products");
    productsResource.addMethod("POST", createProductIntegration);
    productsResource.addMethod("GET", getProductsListIntegration);
    productsResource
      .addResource("{productId}")
      .addMethod("GET", getProductByIdIntegration);

    const getStockIntegration = new apigateway.LambdaIntegration(
      getStockLambda
    );
    api.root.addResource("stock").addMethod("GET", getStockIntegration);
  }
}