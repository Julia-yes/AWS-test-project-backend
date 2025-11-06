import { SQSEvent } from "aws-lambda";
import { addProductToDb } from "./add-product-to-Db";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const REGION = process.env.AWS_REGION;

const snsClient = new SNSClient({ region: REGION });

export const catalogBatchProcess = async (event: SQSEvent) => {
  console.log("Received SQS event:", event, null, 2);

  try {
    const createdProducts = await Promise.all(
      event.Records.map(async (record) => {
        const body = JSON.parse(record.body);

        body.price = Number(body.price);
        body.count = Number(body.count);

        const product = await addProductToDb(body);
        return product;
      })
    );

    console.log("Batch processed successfully.");

    const topicArn = process.env.SNS_TOPIC_ARN;
    if (!topicArn) {
      console.error("SNS_TOPIC_ARN is not defined");
      return;
    }

    const message = {
      Subject: "New products created",
      Message: `The following products have been added:\n${JSON.stringify(
        createdProducts,
        null,
        2
      )}`,
      TopicArn: topicArn,
    };

    await snsClient.send(new PublishCommand(message));
    console.log("SNS message sent successfully.");
  } catch (error) {
    console.error("Error processing SQS batch:", error);
    throw error;
  }
};
