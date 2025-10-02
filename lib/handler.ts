import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ProductService } from "./productService";

export const frontendUrl = "https://d1qgoiucsnqszv.cloudfront.net";

export async function main(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (event.resource === "/products" && event.httpMethod === "GET") {
      const products = ProductService.getAll();
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": frontendUrl,
        },
        body: JSON.stringify(products),
      };
    }
    if (
      event.resource === "/products/{productId}" &&
      event.httpMethod === "GET"
    ) {
      const productId = event.pathParameters?.productId;
      const product = productId ? ProductService.getById(productId) : undefined;

      if (!product) {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": frontendUrl,
          },
          body: JSON.stringify({ message: "Product not found" }),
        };
      }
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": frontendUrl,
        },
        body: JSON.stringify(product),
      };
    }
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": frontendUrl,
      },
      body: JSON.stringify({ message: "Bad request" }),
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
