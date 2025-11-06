import { AttributeValue, DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const productsTable = process.env.PRODUCTS_TABLE_NAME as string;
const stockTable = process.env.STOCK_TABLE_NAME as string;
const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
  }

  interface Stock {
    product_id: string;
    count: number;
  }
  

export const getProductsList = async () => {
  try {
    const productsCommand = new ScanCommand({
      TableName: productsTable,
    });

    const result = await dynamoDB.send(productsCommand);

    const products: Product[] =
      result.Items?.map((item) => ({
        id: item.id.S || "",
        title: item.title.S || "",
        description: item.description.S || "",
        price: parseFloat(item.price.N || "0"),
      })) || [];

    const stockCommand = new ScanCommand({
      TableName: stockTable,
    });
    const stockResult = await dynamoDB.send(stockCommand);

    const stock: { [key: string]: Stock } = (stockResult.Items || []).reduce(
      (acc, item) => {
        const productId = item.product_id.S || "";
        const countString = (item.count as AttributeValue).N || "0";
        acc[productId] = {
          product_id: productId,
          count: parseInt(countString, 10),
        };
        return acc;
      },
      {} as { [key: string]: Stock }
    );

    const combinedProducts =
      products &&
      products.map((product) => ({
        ...product,
        count: stock[product.id]?.count || 0,
      }));

    return {
      statusCode: 200,
      body: combinedProducts,
    };
  } catch (error) {
    console.error("Error retrieving products:", error);
    return {
      statusCode: 500,
      body: "Error retrieving products.",
    };
  }
};