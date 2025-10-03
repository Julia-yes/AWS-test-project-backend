import { APIGatewayProxyEvent, Handler } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({});
const bucketName = process.env.BUCKET_NAME;

export const getUrl: Handler = async (event: APIGatewayProxyEvent) => {
  console.log('Request event:', JSON.stringify(event));

  const fileName = event.queryStringParameters?.name;

  if (!fileName) {
    return {
      statusCode: 400,
      body: 'Missing file name in query parameters.',
    };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `uploaded/${fileName}`,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return {
      statusCode: 200,
      body: signedUrl,
    };
  } catch (error) {
    console.error('Error creating signed URL:', error);

    return {
      statusCode: 500,
      body: 'Failed to create signed URL.',
    };
  }
};
