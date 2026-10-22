
const mongoose = require("mongoose");
const Goal = require("../models/Goal");
const GoalContribution = require("../models/GoalContribution");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Transfer = require("../models/Transfer");

const getUserId = (req) => req.user?._id || req.user?.id;

const validAmount = (value) => {
  if (value === "" || value === null || value === undefined) {
    return false;
  }

  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
};

// Includes ordinary transactions, linked goal contributions,
// transfers, and legacy GoalContribution records.
const calculateAvailableBalance = async (account, userId) => {
  const [transactions, transfers, legacyContributions] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(String(userId)),
          account: account._id,
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]),

    Transfer.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(String(userId)),
          $or: [
            { fromAccount: account._id },
            { toAccount: account._id },
          ],
        },
      },
      {
        $group: {
          _id: null,
          incoming: {
            $sum: {
              $cond: [
                { $eq: ["$toAccount", account._id] },
                "$amount",
                0,
              ],
            },
          },
          outgoing: {
            $sum: {
              $cond: [
                { $eq: ["$fromAccount", account._id] },
                "$amount",
                0,
              ],
            },
          },
        },
      },
    ]),

    GoalContribution.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(String(userId)),
          account: account._id,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  let income = 0;
  let expenses = 0;

  for (const row of transactions) {
    if (row._id === "income") income = row.total;
    if (row._id === "expense") expenses = row.total;
  }

  const transferData = transfers[0] || {
    incoming: 0,
    outgoing: 0,
  };

  const legacyTotal = legacyContributions[0]?.total || 0;

  return (
    Number(account.openingBalance || 0) +
    income -
    expenses +
    transferData.incoming -
    transferData.outgoing -
    legacyTotal
  );
};

const updateGoalProgress = async (goal, delta) => {
  const initialAmount = Number(goal.initialAmount || 0);
  const currentAmount = Number(goal.currentAmount || 0);
  const nextAmount = currentAmount + delta;

  if (nextAmount < initialAmount - 0.000001) {
    throw new Error(
      "This change would reduce goal savings below its initial amount."
    );
  }

  goal.currentAmount = Math.max(initialAmount, nextAmount);

  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = "completed";
  } else if (goal.status === "completed") {
    goal.status = "active";
  }

  await goal.save();
};

// GET /api/goals/:id/contributions
// Returns both new Transaction-based contributions and legacy records.
const getContributions = async (req, res) => {
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
    }).select("_id");

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found.",
      });
    }

    const [transactions, legacyRecords] = await Promise.all([
      Transaction.find({
        user: userId,
        goal: id,
        transactionKind: "goal_contribution",
      })
        .populate("account", "name type color currency")
        .sort({ date: -1, createdAt: -1 })
        .lean(),

      GoalContribution.find({
        user: userId,
        goal: id,
      })
        .populate("account", "name type color currency")
        .sort({ date: -1, createdAt: -1 })
        .lean(),
    ]);

    const transactionRecords = transactions.map((transaction) => ({
      ...transaction,
      source: "transaction",
    }));

    const oldRecords = legacyRecords.map((contribution) => ({
      ...contribution,
      source: "legacy",
    }));

    const contributions = [...transactionRecords, ...oldRecords].sort(
      (a, b) =>
        new Date(b.date || b.createdAt) -
        new Date(a.date || a.createdAt)
    );

    return res.status(200).json({ contributions });
  } catch (error) {
    console.error("Get goal contributions error:", error);

    return res.status(500).json({
      message: "Unable to retrieve contributions.",
    });
  }
};

// POST /api/goals/:id/contributions
// New contributions are saved as Transaction records, not GoalContribution.
const createContribution = async (req, res) => {
  let createdTransaction = null;
  let goalProgressChanged = false;

  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const {
      account: accountId,
      amount: rawAmount,
      date,
      note,
    } = req.body;

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

    // Account is optional.
    if (
      accountId !== undefined &&
      accountId !== null &&
      accountId !== "" &&
      !mongoose.isValidObjectId(accountId)
    ) {
      return res.status(400).json({
        message: "Invalid account ID.",
      });
    }

    if (!validAmount(rawAmount)) {
      return res.status(400).json({
        message: "Contribution amount must be greater than zero.",
      });
    }

    if (
      date !== undefined &&
      (typeof date !== "string" ||
        !date.trim() ||
        Number.isNaN(Date.parse(date)))
    ) {
      return res.status(400).json({
        message: "Please provide a valid contribution date.",
      });
    }

    if (
      note !== undefined &&
      (typeof note !== "string" || note.length > 500)
    ) {
      return res.status(400).json({
        message: "Note must be text and cannot exceed 500 characters.",
      });
    }

    const amount = Number(rawAmount);

    const goal = await Goal.findOne({
      _id: id,
      user: userId,
    });

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found.",
      });
    }

    if (goal.status !== "active") {
      return res.status(400).json({
        message: "Only active goals can receive contributions.",
      });
    }

    let account = null;

    if (accountId) {
      account = await Account.findOne({
        _id: accountId,
        user: userId,
        isArchived: false,
      });

      if (!account) {
        return res.status(400).json({
          message: "Source account not found or archived.",
        });
      }

      const availableBalance = await calculateAvailableBalance(
        account,
        userId
      );

      if (amount > availableBalance) {
        return res.status(400).json({
          message: "Insufficient account balance.",
          availableBalance,
        });
      }
    }

    if (Number(goal.currentAmount || 0) + amount > Number.MAX_SAFE_INTEGER) {
      return res.status(400).json({
        message: "Contribution amount is too large.",
      });
    }

    createdTransaction = await Transaction.create({
      user: userId,
      title: `Contribution to ${goal.name}`,
      amount,
      type: "expense",
      category: "Goal Contribution",
      date: date ? new Date(date) : new Date(),
      paymentMethod: "other",
      note: note?.trim() || "",
      account: account?._id || null,
      goal: goal._id,
      transactionKind: "goal_contribution",
    });

    await updateGoalProgress(goal, amount);
    goalProgressChanged = true;

    const populatedTransaction = await Transaction.findById(
      createdTransaction._id
    )
      .populate("account", "name type color currency")
      .populate("goal", "name");

    return res.status(201).json({
      message: "Contribution added successfully.",
      contribution: {
        ...populatedTransaction.toObject(),
        source: "transaction",
      },
      goal,
    });
  } catch (error) {
    console.error("Create goal contribution error:", error);

    // Best-effort rollback if the goal update fails.
    if (createdTransaction && !goalProgressChanged) {
      await Transaction.deleteOne({
        _id: createdTransaction._id,
        user: getUserId(req),
      }).catch((rollbackError) => {
        console.error("Contribution rollback error:", rollbackError);
      });
    }

    if (
      error.name === "ValidationError" ||
      error.message?.includes("goal savings")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Unable to add contribution.",
    });
  }
};

// DELETE /api/goals/:id/contributions/:contributionId
// Handles both Transaction-based and legacy contributions.
const deleteContribution = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id, contributionId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(contributionId)
    ) {
      return res.status(400).json({
        message: "Invalid goal or contribution ID.",
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

    // First check the new Transaction-based source of truth.
    const transaction = await Transaction.findOne({
      _id: contributionId,
      user: userId,
      goal: id,
      transactionKind: "goal_contribution",
    });

    if (transaction) {
      const originalAmount = Number(goal.currentAmount || 0);
      const originalStatus = goal.status;

      await updateGoalProgress(goal, -Number(transaction.amount));

      try {
        await Transaction.deleteOne({
          _id: transaction._id,
          user: userId,
        });
      } catch (error) {
        // Restore progress if deletion fails.
        goal.currentAmount = originalAmount;
        goal.status = originalStatus;
        await goal.save();
        throw error;
      }

      return res.status(200).json({
        message: "Contribution deleted successfully.",
        contributionId,
        goal,
      });
    }

    // Backward compatibility for old GoalContribution records.
    const legacyContribution = await GoalContribution.findOne({
      _id: contributionId,
      goal: id,
      user: userId,
    });

    if (!legacyContribution) {
      return res.status(404).json({
        message: "Contribution not found.",
      });
    }

    const originalAmount = Number(goal.currentAmount || 0);
    const originalStatus = goal.status;

    await updateGoalProgress(goal, -Number(legacyContribution.amount));

    try {
      await GoalContribution.deleteOne({
        _id: legacyContribution._id,
        user: userId,
      });
    } catch (error) {
      goal.currentAmount = originalAmount;
      goal.status = originalStatus;
      await goal.save();
      throw error;
    }

    return res.status(200).json({
      message: "Legacy contribution deleted successfully.",
      contributionId,
      goal,
    });
  } catch (error) {
    console.error("Delete goal contribution error:", error);

    return res.status(500).json({
      message: error.message || "Unable to delete contribution.",
    });
  }
};

module.exports = {
  getContributions,
  createContribution,
  deleteContribution,
};
