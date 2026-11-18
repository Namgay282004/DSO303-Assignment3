const pool = require("../config/db");

async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, submission_id, type, message,
              is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    return res.status(200).json({
      notifications: result.rows
    });
  } catch (error) {
    console.error("Notification retrieval error:", error.message);

    return res.status(500).json({
      error: "Unable to retrieve notifications"
    });
  }
}

module.exports = { getNotifications };
