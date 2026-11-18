
const pool = require("../config/db");
const { queueMarking } = require("../services/markingQueue");

// Start an exam attempt
exports.startAttempt = async (req, res) => {
  try {
    const { exam_id } = req.body;
    const student_id = req.user.id;

    if (!Number.isInteger(exam_id) || exam_id <= 0) {
      return res.status(400).json({
        error: "Valid exam_id is required"
      });
    }

    const exam = await pool.query(
      `SELECT id, start_time, duration_minutes
       FROM exams
       WHERE id = $1 AND status = 'published'`,
      [exam_id]
    );

    if (exam.rowCount === 0) {
      return res.status(404).json({
        error: "Published exam not found"
      });
    }

    const result = await pool.query(
      `INSERT INTO exam_attempts (exam_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (exam_id, student_id)
       DO NOTHING
       RETURNING *`,
      [exam_id, student_id]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        error: "An attempt already exists for this exam"
      });
    }

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      error: "Unable to start exam"
    });
  }
};

// Autosave an answer
exports.saveAnswer = async (req, res) => {
  const { attempt_id, question_id, answer_text } = req.body;
  const student_id = req.user.id;

  if (
    !Number.isInteger(attempt_id) ||
    attempt_id <= 0 ||
    !Number.isInteger(question_id) ||
    question_id <= 0 ||
    typeof answer_text !== "string"
  ) {
    return res.status(400).json({
      error: "Invalid answer data"
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Lock the attempt to coordinate with submission
    const attemptResult = await client.query(
      `SELECT ea.id, ea.student_id, ea.status,
              ea.started_at, e.start_time,
              e.duration_minutes
       FROM exam_attempts ea
       JOIN exams e ON e.id = ea.exam_id
       WHERE ea.id = $1
         AND e.status = 'published'
       FOR UPDATE OF ea`,
      [attempt_id]
    );

    if (attemptResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Active examination not found"
      });
    }

    const attempt = attemptResult.rows[0];

    if (attempt.student_id !== student_id) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "You cannot modify another student's attempt"
      });
    }

    const startTime = new Date(attempt.start_time);
    const startedAt = new Date(attempt.started_at);

    const deadline = new Date(
      Math.max(startTime.getTime(), startedAt.getTime()) +
      attempt.duration_minutes * 60 * 1000
    );

    const now = new Date();

    if (
      attempt.status !== "in_progress" ||
      now < startTime ||
      now >= deadline
    ) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Attempt is unavailable, expired, or submitted"
      });
    }

    const result = await client.query(
      `INSERT INTO answers
         (attempt_id, question_id, answer_text)
       SELECT ea.id, q.id, $3
       FROM exam_attempts ea
       JOIN questions q ON q.exam_id = ea.exam_id
       WHERE ea.id = $1
         AND q.id = $2
       ON CONFLICT (attempt_id, question_id)
       DO UPDATE SET
         answer_text = EXCLUDED.answer_text,
         saved_at = NOW()
       RETURNING *`,
      [attempt_id, question_id, answer_text]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Question does not belong to this exam"
      });
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Answer saved",
      answer: result.rows[0]
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error(error.message);

    return res.status(500).json({
      error: "Unable to save answer"
    });
  } finally {
    if (client) client.release();
  }
};

// Retrieve saved answers
exports.getSavedAnswers = async (req, res) => {
  try {
    const attempt_id = Number(req.params.id);
    const student_id = req.user.id;

    if (!Number.isInteger(attempt_id) || attempt_id <= 0) {
      return res.status(400).json({
        error: "Invalid attempt ID"
      });
    }

    const attempt = await pool.query(
      `SELECT id, student_id
       FROM exam_attempts
       WHERE id = $1`,
      [attempt_id]
    );

    if (attempt.rowCount === 0) {
      return res.status(404).json({
        error: "Exam attempt not found"
      });
    }

    if (attempt.rows[0].student_id !== student_id) {
      return res.status(403).json({
        error: "You cannot view another student's answers"
      });
    }

    const result = await pool.query(
      `SELECT question_id, answer_text, saved_at
       FROM answers
       WHERE attempt_id = $1
       ORDER BY question_id`,
      [attempt_id]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      error: "Unable to retrieve answers"
    });
  }
};

// Submit an exam attempt
exports.submitAttempt = async (req, res) => {
  const attemptId = Number(req.params.id);
  const studentId = req.user.id;

  if (!Number.isInteger(attemptId) || attemptId <= 0) {
    return res.status(400).json({ error: "Invalid attempt ID" });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT ea.id, ea.student_id, ea.status,
              ea.started_at, e.start_time, e.duration_minutes
       FROM exam_attempts ea
       JOIN exams e ON e.id = ea.exam_id
       WHERE ea.id = $1
       FOR UPDATE OF ea`,
      [attemptId]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Exam attempt not found" });
    }

    const attempt = result.rows[0];

    if (attempt.student_id !== studentId) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "You cannot submit another student's attempt"
      });
    }

    if (attempt.status !== "in_progress") {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Exam already submitted"
      });
    }

    const updated = await client.query(
      `UPDATE exam_attempts
       SET status = 'submitted', submitted_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [attemptId]
    );

    await client.query("COMMIT");

    try {
      await queueMarking(attemptId);
    } catch (queueError) {
      console.error("Failed to queue marking:", queueError.message);
      return res.status(202).json({
        message: "Exam submitted; marking is pending",
        attempt: updated.rows[0],
        marking_queued: false
      });
    }

    return res.status(200).json({
      message: "Exam submitted successfully",
      attempt: updated.rows[0],
      marking_queued: true
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error(error.message);
    return res.status(500).json({
      error: "Unable to submit exam"
    });
  } finally {
    if (client) client.release();
  }
};
