const {
  SQSClient,
  SendMessageCommand,
} = require("@aws-sdk/client-sqs");

const client = new SQSClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

async function queueMarking(attemptId) {
  const queueUrl = process.env.SQS_MARKING_QUEUE_URL;

  if (!queueUrl) {
    throw new Error("SQS_MARKING_QUEUE_URL is not configured");
  }

  await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        type: "MARK_EXAM",
        attempt_id: attemptId,
      }),
    })
  );
}

module.exports = { queueMarking };
