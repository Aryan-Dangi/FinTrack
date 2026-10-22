
const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getBudgets)
  .post(createBudget);

router.route("/:id")
  .patch(updateBudget)
  .delete(deleteBudget);

module.exports = router;
