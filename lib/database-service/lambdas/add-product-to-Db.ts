import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const uuidv4Promise = import("uuid").then(module => module.v4);

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTable = process.env.PRODUCTS_TABLE_NAME as string;
const stockTable = process.env.STOCK_TABLE_NAME as string;

export class ValidationError extends Error {}
export type Body =
{title: string;
  description?: string;
  price: number;
  count: number;}

export const addProductToDb = async (data: Body) => {
  
      if (
        !data.title ||
        typeof data.title !== "string" ||
        data.title.trim() === ""
      ) {
        throw new ValidationError(
          "The 'title' field is required and must be a non-empty string."
        );
      }
  
      if (typeof data.price !== "number" || data.price <= 0) {
        throw new ValidationError("The 'price' field must be a positive number.");
      }
  
      if (typeof data.count !== "number" || data.count < 0) {
        throw new ValidationError(
          "The 'count' field must be a non-negative number."
        );
      }
  
      const uuidv4 = await uuidv4Promise;
  
      const productId = uuidv4();
  
      const addProductCommand = new PutItemCommand({
        TableName: productsTable,
        Item: {
          id: { S: productId },
          title: { S: data.title },
          description: { S: data.description || "" },
          price: { N: data.price.toString() },
        },
      });
  
      await dynamoDB.send(addProductCommand);
      console.log("Product added successfully:", data.title);

      const addStockCommand = new PutItemCommand({
        TableName: stockTable,
        Item: {
          product_id: { S: productId },
          count: { N: data.count.toString() },
        },
      });

      await dynamoDB.send(addStockCommand);
      console.log("Stock added successfully for product:", data.title);

  return data.title;
};