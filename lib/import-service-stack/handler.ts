import { APIGatewayProxyEvent, Handler, S3Event } from "aws-lambda";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import csv from "csv-parser";
import * as stream from "stream";
import { promisify } from "util";

const s3 = new S3Client({});
const bucketName = process.env.BUCKET_NAME;

const pipeline = promisify(stream.pipeline);

export const getUrl: Handler = async (event: APIGatewayProxyEvent) => {
  console.log("Request event:", JSON.stringify(event));

  const fileName = event.queryStringParameters?.name;

  if (!fileName) {
    return {
      statusCode: 400,
      body: "Missing file name in query parameters.",
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
    console.error("Error creating signed URL:", error);

    return {
      statusCode: 500,
      body: "Failed to create signed URL.",
    };
  }
};

export const parser = async (event: S3Event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

      console.log(`Processing object: ${bucketName}/${key}`);

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const s3Response = await s3.send(command);

      if (!s3Response.Body) {
        throw new Error("Unable to fetch object from S3");
      }

      await pipeline(
        s3Response.Body as stream.Readable,
        csv(),
        new stream.Writable({
          objectMode: true,
          write(record, encoding, callback) {
            console.log("Parsed record:", record);
            callback();
          },
        })
      );

      console.log("File processed successfully.");
    }
    return {
      statusCode: 200,
      body: "File processed successfully",
    };
  } catch (error) {
    console.error("Error processing file:", error);

    return {
      statusCode: 500,
      body: "Failed to process file",
    };
  }
};
