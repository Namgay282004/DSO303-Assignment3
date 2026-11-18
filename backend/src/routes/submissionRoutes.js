
const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const {
  requestUploadUrl,
  confirmUpload
} = require("../controllers/submissionController");

// Only authenticated students can submit files
router.use(authenticate);
router.use(authorize("student"));

// Request a temporary S3 upload URL
router.post("/upload-url", requestUploadUrl);

// Confirm the upload and save metadata
router.post("/confirm", confirmUpload);

module.exports = router;
