import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";

export const basicAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent
) => {
  if (!event.authorizationToken) {
   throw new Error("Unauthorized");
  }

  try {
    const token = event.authorizationToken.split(" ")[1];
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [username, password] = decoded.split(":");

    if (process.env.GITHUB_LOGIN === username && process.env.GITHUB_PASSWORD === password) {
      return generatePolicy(username, 'Allow', event.methodArn);
    } else {
      return generatePolicy(username || 'user', 'Deny', event.methodArn);
    }
  } catch (e) {
    throw new Error("Unauthorized");
  }
};

function generatePolicy(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}
