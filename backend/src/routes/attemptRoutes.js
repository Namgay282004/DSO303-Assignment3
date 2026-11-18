
const express = require("express");
const router = express.Router();

const {
  startAttempt,
  saveAnswer,
  getSavedAnswers,
  submitAttempt
} = require("../controllers/attemptController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

// All attempt routes require authentication
router.use(authenticate);

// Only students can access examination attempts
router.use(authorize("student"));

router.post("/", startAttempt);
router.post("/answers", saveAnswer);
router.get("/:id/answers", getSavedAnswers);
router.post("/:id/submit", submitAttempt);

module.exports = router;
