const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

const router = express.Router();

// All transaction endpoints require authentication.
router.use(protect);

router
  .route("/")
  .post(createTransaction)
  .get(getTransactions);

router
  .route("/:id")
  .patch(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;