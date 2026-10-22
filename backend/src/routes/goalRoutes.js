
const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} = require("../controllers/goalController");

const {
  getContributions,
  createContribution,
  deleteContribution,
} = require("../controllers/goalContributionController");

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getGoals)
  .post(createGoal);

router.route("/:id/contributions")
  .get(getContributions)
  .post(createContribution);

router.delete(
  "/:id/contributions/:contributionId",
  deleteContribution
);

router.route("/:id")
  .patch(updateGoal)
  .delete(deleteGoal);

module.exports = router;
