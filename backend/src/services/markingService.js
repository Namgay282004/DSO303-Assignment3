
/**
 * Mark MCQ questions and store provisional results.
 * Uses the same database transaction as exam submission.
 */
async function markMCQ(attemptId, client) {
  const result = await client.query(
    `SELECT
       COALESCE(
         SUM(q.marks) FILTER (
           WHERE q.question_type = 'mcq'
         ), 0
       ) AS total_marks,

       COALESCE(
         SUM(
           CASE
             WHEN q.question_type = 'mcq'
               AND LOWER(TRIM(a.answer_text)) =
                   LOWER(TRIM(q.correct_answer))
             THEN q.marks
             ELSE 0
           END
         ), 0
       ) AS obtained_marks

     FROM exam_attempts ea
     JOIN questions q ON q.exam_id = ea.exam_id
     LEFT JOIN answers a
       ON a.attempt_id = ea.id
       AND a.question_id = q.id

     WHERE ea.id = $1
       AND ea.status = 'submitted'`,
    [attemptId]
  );

  const { total_marks, obtained_marks } = result.rows[0];

  const saved = await client.query(
    `INSERT INTO results
       (attempt_id, total_marks, obtained_marks, released)
     VALUES ($1, $2, $3, false)
     ON CONFLICT (attempt_id)
     DO UPDATE SET
       total_marks = EXCLUDED.total_marks,
       obtained_marks = EXCLUDED.obtained_marks
     RETURNING *`,
    [attemptId, total_marks, obtained_marks]
  );

  return saved.rows[0];
}

module.exports = { markMCQ };
