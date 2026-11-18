const { queueAssignment } = require("../services/assignmentQueue");

const crypto = require("crypto");
const pool = require("../config/db");

const {
  generateUploadUrl,
  verifyUploadedFile,
  MAX_FILE_SIZE
} = require("../services/s3Service");

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/zip"
]);

// Request a temporary upload URL.
exports.requestUploadUrl = async (req, res) => {
  try {
    const {
      assignment_id,
      file_name,
      file_size,
      content_type
    } = req.body;

    const studentId = req.user.id;

    if (
      !Number.isInteger(assignment_id) ||
      assignment_id <= 0 ||
      typeof file_name !== "string" ||
      !file_name.trim() ||
      file_name.length > 255 ||
      !Number.isInteger(file_size) ||
      file_size <= 0 ||
      file_size > MAX_FILE_SIZE ||
      !ALLOWED_TYPES.has(content_type)
    ) {
      return res.status(400).json({
        error: "Invalid file details, type, or size"
      });
    }

    const assignment = await pool.query(
      `SELECT id
       FROM assignments
       WHERE id = $1 AND deadline > NOW()`,
      [assignment_id]
    );

    if (assignment.rowCount === 0) {
      return res.status(404).json({
        error: "Assignment not found or deadline passed"
      });
    }

    const existing = await pool.query(
      `SELECT id
       FROM submissions
       WHERE assignment_id = $1 AND student_id = $2`,
      [assignment_id, studentId]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({
        error: "Assignment already submitted"
      });
    }

    const uploadId = crypto.randomUUID();

    const fileKey =
      `assignments/${assignment_id}/students/${studentId}/${uploadId}`;

    await pool.query(
      `INSERT INTO upload_sessions
       (
         id,
         assignment_id,
         student_id,
         file_key,
         file_name,
         file_size,
         content_type,
         expires_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         NOW() + INTERVAL '5 minutes'
       )`,
      [
        uploadId,
        assignment_id,
        studentId,
        fileKey,
        file_name,
        file_size,
        content_type
      ]
    );

    const uploadUrl = await generateUploadUrl(
      fileKey,
      content_type
    );

    return res.status(200).json({
      upload_url: uploadUrl,
      upload_id: uploadId,
      file_key: fileKey,
      expires_in: 300
    });

  } catch (error) {
    console.error("Upload URL error:", error.message);

    return res.status(500).json({
      error: "Unable to generate upload URL"
    });
  }
};

// Confirm the uploaded file and save submission metadata.
exports.confirmUpload = async (req, res) => {
  const { assignment_id, upload_id } = req.body;
  const studentId = req.user.id;

  if (
    !Number.isInteger(assignment_id) ||
    assignment_id <= 0 ||
    typeof upload_id !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(upload_id)
  ) {
    return res.status(400).json({
      error: "Invalid upload confirmation details"
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const sessionResult = await client.query(
      `SELECT *
       FROM upload_sessions
       WHERE id = $1
         AND assignment_id = $2
         AND student_id = $3
         AND expires_at > NOW()
         AND confirmed_at IS NULL
       FOR UPDATE`,
      [upload_id, assignment_id, studentId]
    );

    if (sessionResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        error: "Upload session invalid, expired, or already used"
      });
    }

    const session = sessionResult.rows[0];

    const assignment = await client.query(
      `SELECT id
       FROM assignments
       WHERE id = $1 AND deadline > NOW()`,
      [assignment_id]
    );

    if (assignment.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "Assignment deadline has passed"
      });
    }

    const file = await verifyUploadedFile(session.file_key);

    if (
      Number(file.size) !== Number(session.file_size) ||
      file.contentType !== session.content_type
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Uploaded file does not match authorized details"
      });
    }

    const result = await client.query(
      `INSERT INTO submissions
       (
         assignment_id,
         student_id,
         file_key,
         file_name,
         file_size
       )
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (assignment_id, student_id)
       DO NOTHING
       RETURNING *`,
      [
        assignment_id,
        studentId,
        session.file_key,
        session.file_name,
        file.size
      ]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "Assignment already submitted"
      });
    }

    await client.query(
      `UPDATE upload_sessions
       SET confirmed_at = NOW()
       WHERE id = $1`,
      [upload_id]
    );

    await client.query("COMMIT");

    // Queue asynchronous assignment processing after saving.
    let processingQueued = false;

    try {
      await queueAssignment(result.rows[0].id);
      processingQueued = true;
    } catch (queueError) {
      console.error(
        "Assignment processing queue failed:",
        queueError.message
      );
    }

    return res.status(201).json({
      message: "File submitted successfully",
      submission: result.rows[0],
      processing_queued: processingQueued
    });

  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError.message);
      }
    }

    console.error("Submission confirmation error:", error.message);

    return res.status(500).json({
      error: "Unable to confirm submission"
    });

  } finally {
    if (client) {
      client.release();
    }
  }
};
