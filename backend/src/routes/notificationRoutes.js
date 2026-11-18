const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const {
  getNotifications
} = require("../controllers/notificationController");

router.get(
  "/",
  authenticate,
  authorize("tutor", "admin"),
  getNotifications
);

module.exports = router;
