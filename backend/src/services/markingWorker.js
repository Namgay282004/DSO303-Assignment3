const {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

const pool = require("../config/db");
const { markMCQ } = require("./markingService");

const sqs = new SQSClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

const queueUrl = process.env.SQS_MARKING_QUEUE_URL;

async function processMessage(message) {
  const job = JSON.parse(message.Body);

  if (job.type === "MARK_EXAM") {
    if (!Number.isInteger(job.attempt_id) || job.attempt_id <= 0) {
      throw new Error("Invalid exam marking message");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const attempt = await client.query(
        `SELECT id
         FROM exam_attempts
         WHERE id = $1 AND status = 'submitted'
         FOR UPDATE`,
        [job.attempt_id]
      );

      if (attempt.rowCount === 0) {
        throw new Error("Submitted exam attempt not found");
      }

      await markMCQ(job.attempt_id, client);
      await client.query("COMMIT");

    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    console.log(`Marked exam attempt ${job.attempt_id}`);

  } else if (job.type === "PROCESS_ASSIGNMENT") {
    if (!Number.isInteger(job.submission_id) || job.submission_id <= 0) {
      throw new Error("Invalid assignment processing message");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `SELECT s.id, s.status, a.created_by, a.title
         FROM submissions s
         JOIN assignments a ON a.id = s.assignment_id
         WHERE s.id = $1
         FOR UPDATE OF s`,
        [job.submission_id]
      );

      if (result.rowCount === 0) {
        throw new Error("Assignment submission not found");
      }

      const submission = result.rows[0];

      if (submission.status === "submitted") {
        await client.query(
          `UPDATE submissions
           SET status = 'processing'
           WHERE id = $1`,
          [job.submission_id]
        );
      }

      await client.query(
        `INSERT INTO notifications
         (user_id, submission_id, type, message)
         VALUES ($1, $2, 'ASSIGNMENT_SUBMITTED', $3)
         ON CONFLICT (user_id, submission_id, type)
         DO NOTHING`,
        [
          submission.created_by,
          job.submission_id,
          `New submission received for assignment: ${submission.title}`
        ]
      );

      await client.query("COMMIT");

      console.log(
        `Processed assignment submission ${job.submission_id} and notified creator`
      );

    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

  } else {
    throw new Error("Unknown SQS job type");
  }

  await sqs.send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: message.ReceiptHandle,
    })
  );
}

async function startWorker() {
  if (!queueUrl) {
    console.error("SQS_MARKING_QUEUE_URL is missing");
    process.exit(1);
  }

  console.log("SQS marking worker started");

  while (true) {
    try {
      const response = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 5,
          WaitTimeSeconds: 20,
          VisibilityTimeout: 180,
        })
      );

      for (const message of response.Messages || []) {
        try {
          await processMessage(message);
        } catch (error) {
          console.error("Marking job failed:", error.message);
        }
      }
    } catch (error) {
      console.error("SQS polling failed:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

startWorker().catch((error) => {
  console.error(error);
  process.exit(1);
});
