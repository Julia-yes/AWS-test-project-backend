import { APIGatewayProxyEvent } from "aws-lambda";

export const frontendUrl = "https://d1qgoiucsnqszv.cloudfront.net"

export async function main(event:APIGatewayProxyEvent) {
  try {
    const mockProducts = [
      { id: "1", title: "Product 1", price: 100, description: "This is product 1" },
      { id: "2", title: "Product 2", price: 200, description: "This is product 2"  },
      { id: "3", title: "Product 3", price: 300, description: "This is product 3"  },
    ];

    return {
      data: JSON.stringify(mockProducts),
    };
  } catch (error) {
    return {
      data: JSON.stringify({ message: "Internal server error", error: (error as Error).message }),
    };
  }
}