const {
  SQSClient,
  SendMessageCommand
} = require("@aws-sdk/client-sqs");

const sqs = new SQSClient({
  region: process.env.AWS_REGION || "ap-south-1"
});

async function queueAssignment(submissionId) {
  if (!Number.isInteger(submissionId) || submissionId <= 0) {
    throw new Error("Invalid submission ID");
  }

  const queueUrl = process.env.SQS_MARKING_QUEUE_URL;

  if (!queueUrl) {
    throw new Error("SQS_MARKING_QUEUE_URL is not configured");
  }

  await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        type: "PROCESS_ASSIGNMENT",
        submission_id: submissionId
      })
    })
  );
}

module.exports = { queueAssignment };
