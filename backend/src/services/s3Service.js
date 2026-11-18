
const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const region = process.env.AWS_REGION || "ap-south-1";
const bucket = process.env.S3_SUBMISSIONS_BUCKET;

const s3 = new S3Client({ region });

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function getBucket() {
  if (!bucket) {
    throw new Error("S3_SUBMISSIONS_BUCKET is not configured");
  }

  return bucket;
}

// Generate a temporary signed URL for S3 uploads.
async function generateUploadUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(s3, command, {
    expiresIn: 300
  });
}

// Verify the uploaded object before confirming submission.
async function verifyUploadedFile(key) {
  const result = await s3.send(
    new HeadObjectCommand({
      Bucket: getBucket(),
      Key: key
    })
  );

  const size = result.ContentLength;

  if (!size || size > MAX_FILE_SIZE) {
    throw new Error("File must be between 1 byte and 50 MB");
  }

  return {
    size,
    contentType: result.ContentType
  };
}

// Delete an uploaded object when cleanup is required.
async function deleteUploadedFile(key) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key
    })
  );
}

module.exports = {
  generateUploadUrl,
  verifyUploadedFile,
  deleteUploadedFile,
  MAX_FILE_SIZE
};
