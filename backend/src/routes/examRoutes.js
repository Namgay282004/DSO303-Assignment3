const express = require("express");
const router = express.Router();

const {
  createExam,
  getExams,
  getExamQuestions
} = require("../controllers/examController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

// Public endpoints
router.get("/", getExams);
router.get("/:id/questions", getExamQuestions);

// Only tutors and admins can create exams
router.post(
  "/",
  authenticate,
  authorize("tutor", "admin"),
  createExam
);

module.exports = router;
