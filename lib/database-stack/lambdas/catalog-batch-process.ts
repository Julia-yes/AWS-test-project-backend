import { SQSEvent } from "aws-lambda";
import { addProductToDb, Body } from "./add-product-to-Db";

export const catalogBatchProcess = async (event: SQSEvent) => {
  console.log("Received SQS event:", event, null, 2);

  try {
    await Promise.all(
      event.Records.map(async (record) => {
        const body = JSON.parse(record.body);
        await addProductToDb(body);
      })
    );

    console.log("Batch processed successfully.");
  } catch (error) {
    console.error("Error processing SQS batch:", error);
    throw error;
  }
};
