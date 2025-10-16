import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const stockTable = process.env.STOCK_TABLE_NAME as string;
const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

export const getStock = async () => {
  try {
    const command = new ScanCommand({
      TableName: stockTable,
    });

    const result = await dynamoDB.send(command);

    const stock = result.Items?.map((item) => ({
      product_id: item.product_id.S,
      count: item.count.N && parseInt(item.count.N, 10),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(stock),
    };
  } catch (error) {
    console.error("Error retrieving stock:", error);
    return {
      statusCode: 500,
      body: "Error retrieving stock.",
    };
  }
};