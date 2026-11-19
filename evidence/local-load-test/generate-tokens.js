const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { Client } = require("pg");

require("dotenv").config({
  path: path.resolve(__dirname, "../../backend/.env")
});

async function main() {
  const client = new Client({
    host: "127.0.0.1",
    port: 5434,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "university_exams_loadtest"
  });

  await client.connect();

  try {
    const result = await client.query(`
      SELECT
        u.id AS student_id,
        ea.id AS attempt_id
      FROM users u
      JOIN exam_attempts ea
        ON ea.student_id = u.id
      WHERE ea.exam_id = 2
        AND u.email ~ '^loadtest\\.student\\.[0-9]+@example\\.invalid$'
      ORDER BY u.id
    `);

    if (result.rows.length !== 100) {
      throw new Error(
        `Expected 100 test students, found ${result.rows.length}`
      );
    }

    const students = result.rows.map((row) => ({
      student_id: row.student_id,
      attempt_id: row.attempt_id,
      token: jwt.sign(
        {
          id: row.student_id,
          role: "student"
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "2h"
        }
      )
    }));

    const output = path.join(__dirname, "students.json");

    fs.writeFileSync(
      output,
      JSON.stringify(students, null, 2),
      { mode: 0o600 }
    );

    console.log(`Generated ${students.length} student tokens.`);
    console.log(`Saved to ${output}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
