
const pool = require("../config/db");

// Create an exam
exports.createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      start_time,
      duration_minutes
    } = req.body;

    const created_by = req.user.id;

    if (!title || !created_by || !start_time ||
        !Number.isInteger(duration_minutes) ||
        duration_minutes <= 0) {
      return res.status(400).json({
        error: "Invalid or missing exam fields"
      });
    }

    const result = await pool.query(
      `INSERT INTO exams
       (title, description, created_by, start_time, duration_minutes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        title,
        description || null,
        created_by,
        start_time,
        duration_minutes
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(error.code === "23503" ? 400 : 500).json({
      error: "Unable to create exam"
    });
  }
};

// Retrieve published exams
exports.getExams = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, start_time,
              duration_minutes, status
       FROM exams
       WHERE status = 'published'
       ORDER BY start_time ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Unable to retrieve exams"
    });
  }
};

// Retrieve exam questions without correct answers
exports.getExamQuestions = async (req, res) => {
  try {
    const { id } = req.params;

    const exam = await pool.query(
      `SELECT id FROM exams
       WHERE id = $1 AND status = 'published'`,
      [id]
    );

    if (exam.rowCount === 0) {
      return res.status(404).json({
        error: "Published exam not found"
      });
    }

    const result = await pool.query(
      `SELECT id, exam_id, question_text,
              question_type, options, marks
       FROM questions
       WHERE exam_id = $1
       ORDER BY id`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "Unable to retrieve questions"
    });
  }
};
