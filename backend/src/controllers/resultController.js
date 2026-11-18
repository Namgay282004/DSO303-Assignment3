
const pool = require("../config/db");

exports.getMyResults = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(
      `SELECT
         e.id AS exam_id,
         e.title AS exam_title,
         ea.id AS attempt_id,
         ea.submitted_at,
         r.total_marks,
         r.obtained_marks,
         r.released,
         r.released_at
       FROM exam_attempts ea
       JOIN exams e ON e.id = ea.exam_id
       JOIN results r ON r.attempt_id = ea.id
       WHERE ea.student_id = $1
         AND ea.status = 'submitted'
         AND r.released = true
       ORDER BY ea.submitted_at DESC`,
      [studentId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Results error:", error.message);
    return res.status(500).json({
      error: "Unable to retrieve results"
    });
  }
};
