
const express = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  analyticsController,
} = require("../controllers/analyticsController");

const router = express.Router();

router.use(protect);

router.get("/", analyticsController);

module.exports = router;
