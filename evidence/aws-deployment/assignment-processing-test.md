# Assignment Processing Test

Date: 17 November 2026

## Environment
- AWS Region: ap-south-1
- Backend: EC2 Auto Scaling Group
- Database: Amazon RDS PostgreSQL
- Queue: Amazon SQS

## Test
An SQS PROCESS_ASSIGNMENT message was sent for submission ID 2.

## Verified Results
- SSM command: Success
- Submission ID: 2
- Submission status: processing
- Notification ID: 1
- Recipient user ID: 4
- Notification type: ASSIGNMENT_SUBMITTED
- Notification is_read: false

## Conclusion
The asynchronous assignment-processing worker successfully
updated the submission and created a tutor notification in PostgreSQL.

The notification API and browser display were not tested in this step.
