import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const frontendUrl = "https://d1qgoiucsnqszv.cloudfront.net";

export async function main(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const mockProducts = [
      {
        id: "1",
        title: "Product 1",
        price: 100,
        description: "This is product 1",
      },
      {
        id: "2",
        title: "Product 2",
        price: 200,
        description: "This is product 2",
      },
      {
        id: "3",
        title: "Product 3",
        price: 300,
        description: "This is product 3",
      },
    ];

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": frontendUrl,
      },
      body: JSON.stringify(mockProducts),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": frontendUrl,
      },
      body: JSON.stringify({
        message: "Internal server error",
        error: (error as Error).message,
      }),
    };
  }
}
