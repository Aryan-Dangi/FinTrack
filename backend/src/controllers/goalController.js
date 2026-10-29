
const mongoose = require("mongoose");
const Goal = require("../models/Goal");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const GoalContribution = require("../models/GoalContribution");

const getUserId = (req) => req.user?._id || req.user?.id;

let transactionSupportWarningLogged = false;

const transactionsUnsupported = (error) =>
  error?.code === 20 && error?.codeName === "IllegalOperation";

const runInTransaction = async (work) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(() => work(session));
  } catch (error) {
    if (!transactionsUnsupported(error)) throw error;

    if (!transactionSupportWarningLogged) {
      console.warn(
        "MongoDB transactions are unavailable; using standalone compatibility mode."
      );
      transactionSupportWarningLogged = true;
    }

    return work(undefined);
  } finally {
    await session.endSession();
  }
};

const allowedCategories = [
  "Emergency Fund",
  "Travel",
  "Education",
  "Vehicle",
  "Home",
  "Gadgets",
  "Investment",
  "Other",
];

const allowedStatuses = ["active", "completed", "cancelled"];

const validDate = (value) => {
  if (value === null || value === "") return true;
  return !Number.isNaN(new Date(value).getTime());
};

const validateGoalInput = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (
      typeof data.name !== "string" ||
      !data.name.trim() ||
      data.name.trim().length > 100
    ) {
      errors.push("Name is required and must be at most 100 characters.");
    }
  }

  if (!isUpdate || data.targetAmount !== undefined) {
    const amount = Number(data.targetAmount);

    if (
      data.targetAmount === "" ||
      data.targetAmount === null ||
      data.targetAmount === undefined ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      errors.push("Target amount must be greater than zero.");
    }
  }

  if (isUpdate && data.currentAmount !== undefined) {
    errors.push(
      "Current savings cannot be edited directly. Use goal contributions."
    );
  }

  if (isUpdate && data.initialAmount !== undefined) {
    errors.push("Initial savings cannot be edited after goal creation.");
  }

  if (
    data.category !== undefined &&
    !allowedCategories.includes(data.category)
  ) {
    errors.push("Invalid goal category.");
  }

  if (
    data.status !== undefined &&
    !allowedStatuses.includes(data.status)
  ) {
    errors.push("Invalid goal status.");
  }

  if (
    data.targetDate !== undefined &&
    !validDate(data.targetDate)
  ) {
    errors.push("Target date must be a valid date.");
  }

  if (
    data.note !== undefined &&
    (typeof data.note !== "string" || data.note.length > 300)
  ) {
    errors.push("Note must be a string of at most 300 characters.");
  }

  if (!isUpdate && data.initialAmount !== undefined) {
    const amount = Number(data.initialAmount);

    if (
      data.initialAmount === "" ||
      data.initialAmount === null ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      errors.push("Initial savings must be a non-negative number.");
    }
  }

  return errors;
};

const sendValidationErrors = (res, errors) =>
  res.status(400).json({
    message: "Please correct the goal details.",
    errors,
  });

const getGoalStatus = (currentAmount, targetAmount, requestedStatus) => {
  if (requestedStatus === "cancelled") return "cancelled";

  return Number(currentAmount) >= Number(targetAmount)
    ? "completed"
    : "active";
};

// GET /api/goals
const getGoals = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const filter = { user: userId };

    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          message: "Invalid status filter.",
        });
      }

      filter.status = req.query.status;
    }

    const goals = await Goal.find(filter).sort({
      status: 1,
      targetDate: 1,
      createdAt: -1,
    });

    const summary = goals.reduce(
      (result, goal) => {
        result.totalGoals += 1;
        result.totalTarget += Number(goal.targetAmount || 0);
        result.totalSaved += Number(goal.currentAmount || 0);

        if (goal.status === "active") result.activeGoals += 1;
        if (goal.status === "completed") result.completedGoals += 1;

        return result;
      },
      {
        totalGoals: 0,
        activeGoals: 0,
        completedGoals: 0,
        totalTarget: 0,
        totalSaved: 0,
      }
    );

    summary.totalRemaining = Math.max(
      0,
      summary.totalTarget - summary.totalSaved
    );

    return res.status(200).json({ goals, summary });
  } catch (error) {
    console.error("Get goals error:", error);

    return res.status(500).json({
      message: "Failed to fetch goals.",
    });
  }
};

// POST /api/goals
const createGoal = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const errors = validateGoalInput(req.body);

    if (errors.length) return sendValidationErrors(res, errors);

    const targetAmount = Number(req.body.targetAmount);
    const initialAmount = Number(
      req.body.initialAmount ?? req.body.currentAmount ?? 0
    );

    if (!Number.isFinite(initialAmount) || initialAmount < 0) {
      return sendValidationErrors(res, [
        "Initial savings must be a non-negative number.",
      ]);
    }

    const initialAccountId = req.body.initialAccountId || null;

    if (
      initialAccountId &&
      !mongoose.isValidObjectId(initialAccountId)
    ) {
      return res.status(400).json({
        message: "Invalid account ID.",
      });
    }

    let account = null;

    if (initialAccountId) {
      account = await Account.findOne({
        _id: initialAccountId,
        user: userId,
        isArchived: false,
      });

      if (!account) {
        return res.status(400).json({
          message: "The selected account was not found or is archived.",
        });
      }

      if (initialAmount <= 0) {
        return res.status(400).json({
          message:
            "Initial savings must be greater than zero when an account is selected.",
        });
      }
    }

    // An account-linked initial amount is recorded as a contribution.
    // Without an account, it is treated as pre-existing savings.
    const baselineAmount = account ? 0 : initialAmount;

    const goal = await runInTransaction(async (session) => {
      const [createdGoal] = await Goal.create(
        [
          {
            user: userId,
            name: req.body.name.trim(),
            targetAmount,
            initialAmount: baselineAmount,
            currentAmount: baselineAmount,
            category: req.body.category || "Other",
            targetDate: req.body.targetDate || null,
            note: req.body.note || "",
            status: getGoalStatus(
              baselineAmount,
              targetAmount,
              req.body.status
            ),
          },
        ],
        { session }
      );

      if (account && initialAmount > 0) {
        await Transaction.create(
          [
            {
              user: userId,
              account: account._id,
              goal: createdGoal._id,
              transactionKind: "goal_contribution",
              title: `Initial contribution: ${createdGoal.name}`.slice(0, 100),
              amount: initialAmount,
              type: "expense",
              category: "Goal Contribution",
              date: new Date(),
              paymentMethod: "other",
              note: "Initial goal contribution",
            },
          ],
          { session }
        );

        createdGoal.currentAmount = initialAmount;
        createdGoal.status = getGoalStatus(
          createdGoal.currentAmount,
          createdGoal.targetAmount,
          req.body.status
        );
        await createdGoal.save({ session });
      }

      return createdGoal;
    });

    return res.status(201).json({
      message: "Goal created successfully.",
      goal,
    });
  } catch (error) {
    console.error("Create goal error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create goal.",
    });
  }
};

// PATCH /api/goals/:id
const updateGoal = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid goal ID.",
      });
    }

    const errors = validateGoalInput(req.body, true);

    if (errors.length) return sendValidationErrors(res, errors);

    const goal = await Goal.findOne({
      _id: id,
      user: userId,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found.",
      });
    }

    const editableFields = [
      "name",
      "targetAmount",
      "category",
      "targetDate",
      "note",
    ];

    for (const field of editableFields) {
      if (req.body[field] === undefined) continue;

      if (field === "name") {
        goal.name = req.body.name.trim();
      } else if (field === "targetAmount") {
        goal.targetAmount = Number(req.body.targetAmount);
      } else if (field === "targetDate") {
        goal.targetDate = req.body.targetDate || null;
      } else if (field === "note") {
        goal.note = req.body.note.trim();
      } else {
        goal[field] = req.body[field];
      }
    }

    if (req.body.status === "cancelled") {
      goal.status = "cancelled";
    } else if (
      req.body.status !== undefined ||
      req.body.targetAmount !== undefined
    ) {
      goal.status = getGoalStatus(
        Number(goal.currentAmount || 0),
        Number(goal.targetAmount),
        req.body.status
      );
    }

    await goal.save();

    return res.status(200).json({
      message: "Goal updated successfully.",
      goal,
    });
  } catch (error) {
    console.error("Update goal error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update goal.",
    });
  }
};

// DELETE /api/goals/:id
const deleteGoal = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid goal ID.",
      });
    }

    const goal = await Goal.findOne({
      _id: id,
      user: userId,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found.",
      });
    }

    const deletion = await runInTransaction(async (session) => {
      // Find modern contribution transactions, including older records
      // that may have category set but no transactionKind.
      const contributions = await Transaction.find(
        {
          user: userId,
          goal: goal._id,
          $or: [
            { transactionKind: "goal_contribution" },
            { category: "Goal Contribution" },
          ],
        },
        null,
        { session }
      ).select("_id");

      const contributionIds = contributions.map(
        (transaction) => transaction._id
      );

      if (contributionIds.length > 0) {
        await Transaction.updateMany(
          { _id: { $in: contributionIds }, user: userId },
          { $set: { account: null, goal: null } },
          { session }
        );
      }

      const legacyResult = await GoalContribution.deleteMany(
        { user: userId, goal: goal._id },
        { session }
      );

      const result = await Goal.deleteOne(
        { _id: goal._id, user: userId },
        { session }
      );

      if (result.deletedCount !== 1) {
        throw new Error("The goal could not be deleted.");
      }

      return {
        contributionCount: contributionIds.length,
        legacyContributionCount: legacyResult.deletedCount,
      };
    });

    return res.status(200).json({
      message:
        "Goal deleted successfully. Linked account balance deductions have been removed.",
      goalId: String(goal._id),
      preservedTransactions: deletion.contributionCount,
      removedLegacyContributions: deletion.legacyContributionCount,
    });
  } catch (error) {
    console.error("Delete goal error:", error);

    return res.status(500).json({
      message:
        "Failed to delete goal. Please refresh and verify your financial records.",
    });
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
};
