
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cdk from 'aws-cdk-lib';
import {  join } from 'path';
import * as apigateway from "aws-cdk-lib/aws-apigateway";

const dotenv = require("dotenv");
dotenv.config(); 

const PRODUCTS_TABLE_NAME = process.env.PRODUCTS_TABLE_NAME;
const STOCK_TABLE_NAME = process.env.STOCK_TABLE_NAME;
const REGION = process.env.AWS_REGION;
const LAMBDA_API_URL = process.env.LAMBDA_API_URL;

if (!PRODUCTS_TABLE_NAME || !STOCK_TABLE_NAME || !REGION || !LAMBDA_API_URL) {
  throw new Error("Missing required environment variables. Please check your .env file.");
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

    const createProductLambda = new lambda.Function(this, 'lambda-function', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      handler: 'handler.createProduct',
      code: lambda.Code.fromAsset(join(__dirname, './')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,     
      }
    });
    const getProductsListLambda = new lambda.Function(this, "GetProductsListFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      handler: "handler.getProductsList",
      code: lambda.Code.fromAsset(join(__dirname, "./")),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    const getProductByIdLambda = new lambda.Function(
      this,
      "GetProductByIdFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 512,
        timeout: cdk.Duration.seconds(5),
        handler: "handler.getProductById",
        code: lambda.Code.fromAsset(join(__dirname, "./")),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCK_TABLE_NAME: stockTable.tableName,
        },
      }
    );

    const getStockLambda = new lambda.Function(this, "GetStockFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(5),
      handler: "handler.getStock",
      code: lambda.Code.fromAsset(join(__dirname, "./")),
      environment: {
        STOCK_TABLE_NAME: stockTable.tableName,
      },
    });

    productsTable.grantWriteData(createProductLambda);
    stockTable.grantWriteData(createProductLambda);
    productsTable.grantReadData(getProductsListLambda);
    productsTable.grantReadData(getStockLambda);
    stockTable.grantReadData(getStockLambda);
    stockTable.grantReadData(getProductsListLambda);
    stockTable.grantReadData(getProductByIdLambda);

    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Products Service",
      description: "API for managing products and stock.",
    });

    const createProductIntegration = new apigateway.LambdaIntegration(createProductLambda);
    const getProductsListIntegration = new apigateway.LambdaIntegration(getProductsListLambda);
    const getProductByIdIntegration = new apigateway.LambdaIntegration(getProductByIdLambda);
    productsTable.grantReadData(getProductByIdLambda);

    const productsResource = api.root.addResource("products"); 
    productsResource.addMethod("POST", createProductIntegration); 
    productsResource.addMethod("GET", getProductsListIntegration); 
    productsResource.addResource("{productId}").addMethod("GET", getProductByIdIntegration);

    const getStockIntegration = new apigateway.LambdaIntegration(getStockLambda);
    api.root.addResource("stock").addMethod("GET", getStockIntegration);
  
  }
}