import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
const dotenv = require("dotenv");

dotenv.config();


export const basicAuthorizer = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  const authHeader = event.headers?.Authorization;

  if (!authHeader) {
    return {
      statusCode: 401,
      body: 'Authorization header missing',
    };
  }

  const token = authHeader.split(' ')[1];
  const decoded = Buffer.from(token, 'base64').toString('utf-8');
  const [username, password] = decoded.split(':');

  if (process.env[username] && process.env[username] === password) {
    return {
      statusCode: 200,
      body: 'Authorized',
    };
  } else {
    return {
      statusCode: 403,
      body: 'Access denied',
    };
  }
};
