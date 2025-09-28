
import { APIGatewayProxyEvent, APIGatewayProxyResult, AttributeValue, Handler } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
const uuidv4Promise = import("uuid").then(module => module.v4);

const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const productsTable = process.env.PRODUCTS_TABLE_NAME as string;
const stockTable = process.env.STOCK_TABLE_NAME as string;

class ValidationError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

interface Stock {
  product_id: string;
  count: number;
}

interface CombinedProduct extends Product {
  count: number;
}

export const createProduct: Handler = async (event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
      const parsedBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

      console.log("Received event:", parsedBody);
      if (!parsedBody.title || typeof parsedBody.title !== "string" || parsedBody.title.trim() === "") {
        throw new ValidationError("The 'title' field is required and must be a non-empty string.");
      }
  
      if (typeof parsedBody.price !== "number" || parsedBody.price <= 0) {
        throw new ValidationError("The 'price' field must be a positive number.");
      }
  
      if (typeof parsedBody.count !== "number" || parsedBody.count < 0) {
        throw new ValidationError("The 'count' field must be a non-negative number.");
      }

        const uuidv4 = await uuidv4Promise;

        const productId = uuidv4();

      const addProductCommand = new PutItemCommand({
        TableName: productsTable,
        Item: {
          id: { S: productId },   
          title: { S: parsedBody.title }, 
        description: { S: parsedBody.description || "" },
        price: { N: parsedBody.price.toString() },
        }
      });

       await dynamoDB.send(addProductCommand);
      console.log("Product added successfully:", productId);

      const addStockCommand = new PutItemCommand({
        TableName: stockTable,
        Item: {
          product_id: { S: productId },      
          count: { N: parsedBody.count.toString() },  
        },
      });
  
      await dynamoDB.send(addStockCommand);
      console.log("Stock added successfully for product:", productId);

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Product and stock added successfully.",
          productId: productId,
        }),
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        console.warn("Validation error:", error.message);
        return {
          statusCode: 400,
          body: JSON.stringify({ message: error.message }),
        };
      } else {
        console.error('Error:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: (error as Error).message,
          }),
        };
    }}
};

export const getProductsList = async () => {
  console.log("PRODUCTS_TABLE_NAME:", productsTable);
  try {
    const productsCommand = new ScanCommand({
      TableName: productsTable,
    });

    const result = await dynamoDB.send(productsCommand);

    const products : Product[]  = result.Items?.map((item) => ({
      id: item.id.S || "",
      title: item.title.S || "",
      description: item.description.S || "",
      price:  parseFloat(item.price.N || "0"),
    })) || [];

    const stockCommand = new ScanCommand({
      TableName: stockTable,
    });
    const stockResult = await dynamoDB.send(stockCommand);

    const stock: { [key: string]: Stock } = (stockResult.Items || []).reduce((acc, item) => {
      const productId = item.product_id.S || "";
      const countString = (item.count as AttributeValue).N || "0"; 
    acc[productId] = {
      product_id: productId,
      count: parseInt(countString, 10), 
    };
      return acc;
    },{} as { [key: string]: Stock } );

    
    const combinedProducts = products && products.map((product) => ({
      ...product,
      count: stock[product.id]?.count || 0, 
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(combinedProducts),
    };
  } catch (error) {
    console.error("Error retrieving products:", error);
    return {
      statusCode: 500,
      body: "Error retrieving products.",
    };
  }
};

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

export const getProductById = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Raw pathParameters:", JSON.stringify(event.pathParameters));

    const productId = event.pathParameters?.productId;
console.log("id", productId)
    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing required path parameter 'productId'.",
        }),
      };
    }

    console.log("Fetching product with ID:", productId);

    const command = new GetItemCommand({
      TableName: productsTable,
      Key: {
        id: { S: productId },
      },
    });

    const productResult = await dynamoDB.send(command);

    if (!productResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: `Product with ID '${productId}' not found.`,
        }),
      };
    }

    const product = {
      id: productResult.Item.id.S || "",
      title: productResult.Item.title.S || "",
      description: productResult.Item.description.S || "",
      price: parseFloat(productResult.Item.price.N || "0"),
    };

    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } catch (error) {
    console.error("Error retrieving product by ID:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error retrieving product by ID.",
        error: (error as Error).message,
      }),
    };
  }
};