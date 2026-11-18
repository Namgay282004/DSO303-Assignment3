
require("dotenv").config();
const resultRoutes = require("./routes/resultRoutes");
const examRoutes = require("./routes/examRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const authRoutes = require("./routes/authRoutes");
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const submissionRoutes = require("./routes/submissionRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/results", resultRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "DSO303 Assignment 2 API"
  });
});

app.get("/api", (req, res) => {
  res.json({
    message: "University Examination API is running"
  });
});

app.get("/api/db-health", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS time"
    );

    res.status(200).json({
      status: "connected",
      database: result.rows[0].database,
      time: result.rows[0].time
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(503).json({
      status: "disconnected",
      message: "Database connection failed"
    });
  }
});

const PORT = process.env.PORT || 3000;


app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});

