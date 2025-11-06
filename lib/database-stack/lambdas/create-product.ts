import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda";
import { addProductToDb } from "./add-product-to-Db";

class ValidationError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const createProduct: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const parsedBody =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

      await addProductToDb(parsedBody);

    return {
      statusCode: 200,
      body: "Product and stock added successfully.",
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      console.warn("Validation error:", error.message);
      return {
        statusCode: 400,
        body: error.message,
      };
    } else {
      console.error("Error:", error);
      return {
        statusCode: 500,
        body: (error as Error).message,
      };
    }
  }
};
