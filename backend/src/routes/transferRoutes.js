const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  createTransfer,
  getTransfers,
  deleteTransfer,
} = require("../controllers/transferController");

const router = express.Router();

// Every transfer endpoint requires authentication.
router.use(protect);

router.route("/")
  .get(getTransfers)
  .post(createTransfer);

router.delete("/:id", deleteTransfer);

module.exports = router;