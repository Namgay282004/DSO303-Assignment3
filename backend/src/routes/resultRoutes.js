
const express = require("express");
const router = express.Router();

const { getMyResults } = require("../controllers/resultController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

router.use(authenticate);
router.use(authorize("student"));

router.get("/my", getMyResults);

module.exports = router;
