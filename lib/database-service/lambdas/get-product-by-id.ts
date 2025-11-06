
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { DynamoDBClient, GetItemCommand} from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTable = process.env.PRODUCTS_TABLE_NAME as string;
const stockTable = process.env.STOCK_TABLE_NAME as string;

export const getProductById = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const productId = event.pathParameters?.productId;
    if (!productId) {
      return {
        statusCode: 400,
        body: "Missing required path parameter 'productId'.",
      };
    }

    console.log("Fetching product with ID:", productId);

    const productCommand = new GetItemCommand({
      TableName: productsTable,
      Key: {
        id: { S: productId },
      },
    });

    const productResult = await dynamoDB.send(productCommand);

    if (!productResult.Item) {
      return {
        statusCode: 404,
        body: `Product with ID '${productId}' not found.`,
      };
    }

    const product = {
      id: productResult.Item.id.S || "",
      title: productResult.Item.title.S || "",
      description: productResult.Item.description.S || "",
      price: parseFloat(productResult.Item.price.N || "0"),
    };

    console.log("Fetching stock for product with ID:", productId);
    const stockCommand = new GetItemCommand({
      TableName: stockTable,
      Key: {
        product_id: { S: productId },
      },
    });

    const stockResult = await dynamoDB.send(stockCommand);

    const stock = stockResult.Item
      ? {
          count: parseInt(stockResult.Item.count.N || "0", 10),
        }
      : {
          count: 0,
        };

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...product,
        count: stock.count,
      }),
    };
  } catch (error) {
    console.error("Error retrieving product by ID:", error);

    return {
      statusCode: 500,
      body: "Error retrieving product by ID.",
    };
  }
};
