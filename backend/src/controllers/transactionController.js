
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const Goal = require("../models/Goal");

const getUserId = (req) => req.user?._id || req.user?.id;

const allowedFields = [
  "title",
  "amount",
  "type",
  "category",
  "date",
  "paymentMethod",
  "note",
  "account",
  "goal",
  "transactionKind",
];

const paymentMethods = ["cash", "card", "bank_transfer", "upi", "other"];

const isContribution = (transaction) =>
  transaction?.transactionKind === "goal_contribution" ||
  transaction?.category === "Goal Contribution";

const getAllowedFields = (body = {}) => {
  const data = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  return data;
};

const normalizeData = (data) => {
  if (typeof data.title === "string") {
    data.title = data.title.trim();
  }

  if (typeof data.category === "string") {
    data.category = data.category.trim();
  }

  if (data.amount !== undefined) {
    data.amount = Number(data.amount);
  }

  if (typeof data.note === "string") {
    data.note = data.note.trim();
  }

  if (data.date !== undefined && data.date !== "") {
    data.date = new Date(data.date);
  }

  if (data.account === "") {
    data.account = null;
  }

  if (data.goal === "") {
    data.goal = null;
  }

  return data;
};

const validateData = (
  data,
  { isUpdate = false, contribution = false } = {}
) => {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (
      typeof data.title !== "string" ||
      data.title.trim().length < 2 ||
      data.title.trim().length > 100
    ) {
      errors.push("Title must contain between 2 and 100 characters.");
    }
  }

  if (!isUpdate || data.amount !== undefined) {
    if (
      data.amount === "" ||
      data.amount === null ||
      data.amount === undefined ||
      !Number.isFinite(Number(data.amount)) ||
      Number(data.amount) <= 0
    ) {
      errors.push("Amount must be a number greater than zero.");
    }
  }

  if (!isUpdate || data.type !== undefined) {
    if (!["income", "expense"].includes(data.type)) {
      errors.push("Type must be income or expense.");
    }
  }

  if (!contribution && (!isUpdate || data.category !== undefined)) {
    if (
      typeof data.category !== "string" ||
      !data.category.trim() ||
      data.category.trim().length > 50
    ) {
      errors.push("Category is required and cannot exceed 50 characters.");
    }
  }

  if (
    data.date !== undefined &&
    !Number.isFinite(new Date(data.date).getTime())
  ) {
    errors.push("Please provide a valid transaction date.");
  }

  if (
    data.paymentMethod !== undefined &&
    !paymentMethods.includes(data.paymentMethod)
  ) {
    errors.push("Invalid payment method.");
  }

  if (
    data.note !== undefined &&
    (typeof data.note !== "string" || data.note.length > 500)
  ) {
    errors.push("Note must be text and cannot exceed 500 characters.");
  }

  if (
    data.account !== undefined &&
    data.account !== null &&
    data.account !== "" &&
    !mongoose.isValidObjectId(data.account)
  ) {
    errors.push("Invalid account ID.");
  }

  if (
    data.goal !== undefined &&
    data.goal !== null &&
    data.goal !== "" &&
    !mongoose.isValidObjectId(data.goal)
  ) {
    errors.push("Invalid goal ID.");
  }

  if (
    data.transactionKind !== undefined &&
    !["standard", "goal_contribution"].includes(data.transactionKind)
  ) {
    errors.push("Invalid transaction kind.");
  }

  return errors;
};

const validateAccountOwnership = async (accountId, userId) => {
  if (accountId === null || accountId === undefined || accountId === "") {
    return true;
  }

  if (!mongoose.isValidObjectId(accountId)) {
    return false;
  }

  const account = await Account.findOne({
    _id: accountId,
    user: userId,
    isArchived: false,
  }).select("_id");

  return Boolean(account);
};

const findOwnedGoal = async (goalId, userId) => {
  if (!goalId || !mongoose.isValidObjectId(goalId)) {
    return null;
  }

  return Goal.findOne({
    _id: goalId,
    user: userId,
  });
};

const resolveKind = (data, existing = null) => {
  if (data.transactionKind !== undefined) {
    return data.transactionKind;
  }

  if (data.category !== undefined) {
    return data.category === "Goal Contribution"
      ? "goal_contribution"
      : "standard";
  }

  return existing?.transactionKind ||
    (existing?.category === "Goal Contribution"
      ? "goal_contribution"
      : "standard");
};

const prepareContribution = async (
  data,
  userId,
  kind,
  existing = null
) => {
  if (kind !== "goal_contribution") {
    data.transactionKind = "standard";
    data.goal = null;

    return {
      ok: true,
      contribution: false,
    };
  }

  const goalId =
    data.goal !== undefined
      ? data.goal
      : existing?.goal;

  const goal = await findOwnedGoal(goalId, userId);

  if (!goal) {
    return {
      ok: false,
      message: "Please select a valid savings goal.",
    };
  }

  if (!existing && goal.status !== "active") {
    return {
      ok: false,
      message: "Only active goals can receive contributions.",
    };
  }

  if (existing && goal.status === "cancelled") {
    return {
      ok: false,
      message: "A cancelled goal cannot receive a contribution.",
    };
  }

  data.transactionKind = "goal_contribution";
  data.goal = goal._id;
  data.category = "Goal Contribution";

  if (!data.title) {
    data.title =
      existing?.title || `Contribution to ${goal.name}`;
  }

  const type = data.type ?? existing?.type;

  if (type !== "expense") {
    return {
      ok: false,
      message: "A goal contribution must be an expense transaction.",
    };
  }

  data.type = "expense";

  return {
    ok: true,
    contribution: true,
    goal,
  };
};

/**
 * currentAmount is the total saved.
 * initialAmount is the baseline that tracked contributions
 * must not reduce below.
 */
const applyGoalDelta = async (goalId, userId, delta) => {
  if (!goalId || Math.abs(delta) < 0.000001) {
    return;
  }

  const goal = await Goal.findOne({
    _id: goalId,
    user: userId,
  });

  if (!goal) {
    throw new Error("The linked savings goal no longer exists.");
  }

  const currentAmount = Number(goal.currentAmount || 0);
  const initialAmount = Number(goal.initialAmount || 0);
  const nextAmount = currentAmount + delta;

  if (nextAmount < initialAmount - 0.000001) {
    throw new Error(
      "This change would reduce goal savings below its initial amount."
    );
  }

  goal.currentAmount = Math.max(initialAmount, nextAmount);

  if (goal.status !== "cancelled") {
    goal.status =
      goal.currentAmount >= Number(goal.targetAmount)
        ? "completed"
        : "active";
  }

  await goal.save();
};

const populateTransaction = (query) =>
  query.populate("goal", "name").populate("account", "name");

const createTransaction = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const data = normalizeData(getAllowedFields(req.body));
    const kind = resolveKind(data);

    const prepared = await prepareContribution(
      data,
      userId,
      kind
    );

    if (!prepared.ok) {
      return res.status(400).json({
        message: prepared.message,
      });
    }

    if (data.date === undefined) {
      data.date = new Date();
    }

    if (data.paymentMethod === undefined) {
      data.paymentMethod = "other";
    }

    if (data.note === undefined) {
      data.note = "";
    }

    const errors = validateData(data, {
      contribution: prepared.contribution,
    });

    if (errors.length) {
      return res.status(400).json({
        message: errors[0],
        errors,
      });
    }

    const validAccount = await validateAccountOwnership(
      data.account,
      userId
    );

    if (!validAccount) {
      return res.status(400).json({
        message: "Account not found, archived, or not owned by you.",
      });
    }

    data.user = userId;

    const transaction = await Transaction.create(data);

    try {
      if (isContribution(transaction)) {
        await applyGoalDelta(
          transaction.goal,
          userId,
          Number(transaction.amount)
        );
      }
    } catch (error) {
      await Transaction.deleteOne({
        _id: transaction._id,
        user: userId,
      });

      throw error;
    }

    const result = await populateTransaction(
      Transaction.findOne({
        _id: transaction._id,
        user: userId,
      })
    ).lean();

    return res.status(201).json({
      message: "Transaction created successfully.",
      transaction: result,
    });
  } catch (error) {
    console.error("Create transaction error:", error);

    if (
      error.name === "ValidationError" ||
      /goal|savings/i.test(error.message || "")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Unable to create transaction.",
    });
  }
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildTransactionFilter = (query, userId) => {
  const filter = { user: userId };

  if (query.type) {
    if (!["income", "expense"].includes(query.type)) {
      throw new Error("Type must be income or expense.");
    }

    filter.type = query.type;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.account) {
    if (!mongoose.isValidObjectId(query.account)) {
      throw new Error("Invalid account filter.");
    }

    filter.account = query.account;
  }

  if (query.dateFrom || query.dateTo) {
    filter.date = {};

    if (query.dateFrom) {
      const from = new Date(query.dateFrom);

      if (Number.isNaN(from.getTime())) {
        throw new Error("Invalid dateFrom value.");
      }

      filter.date.$gte = from;
    }

    if (query.dateTo) {
      const to = new Date(query.dateTo);

      if (Number.isNaN(to.getTime())) {
        throw new Error("Invalid dateTo value.");
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(query.dateTo)) {
        to.setUTCHours(23, 59, 59, 999);
      }

      filter.date.$lte = to;
    }

    if (
      filter.date.$gte &&
      filter.date.$lte &&
      filter.date.$gte > filter.date.$lte
    ) {
      throw new Error("dateFrom cannot be later than dateTo.");
    }
  }

  if (query.search) {
    const search = String(query.search).trim().slice(0, 100);

    if (search) {
      const regex = {
        $regex: escapeRegex(search),
        $options: "i",
      };

      filter.$or = [
        { title: regex },
        { category: regex },
        { note: regex },
      ];
    }
  }

  return filter;
};

const getTransactions = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    let filter;

    try {
      filter = buildTransactionFilter(req.query, userId);
    } catch (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const ordinaryFilter = {
      ...filter,
      transactionKind: { $ne: "goal_contribution" },
      category: { $ne: "Goal Contribution" },
    };

    const contributionFilter = {
      ...filter,
      $or: [
        { transactionKind: "goal_contribution" },
        { category: "Goal Contribution" },
      ],
    };

    const [
      transactions,
      total,
      ordinaryTotals,
      contributionTotals,
    ] = await Promise.all([
      populateTransaction(
        Transaction.find(filter)
          .sort({createdAt: -1, _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
      ).lean(),

      Transaction.countDocuments(filter),

      Transaction.aggregate([
        { $match: ordinaryFilter },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),

      Transaction.aggregate([
        { $match: contributionFilter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = {
      income: 0,
      expenses: 0,
      net: 0,
      goalContributions: contributionTotals[0]?.totalAmount || 0,
      goalContributionCount: contributionTotals[0]?.count || 0,
      count: total,
    };

    for (const row of ordinaryTotals) {
      if (row._id === "income") {
        summary.income = row.totalAmount;
      }

      if (row._id === "expense") {
        summary.expenses = row.totalAmount;
      }
    }

    summary.net = summary.income - summary.expenses;

    return res.status(200).json({
      transactions,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);

    return res.status(500).json({
      message: "Unable to retrieve transactions.",
    });
  }
};

const updateTransaction = async (req, res) => {
  let existing = null;
  let transactionUpdated = false;
  const appliedDeltas = [];

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
        message: "Invalid transaction ID.",
      });
    }

    existing = await Transaction.findOne({
      _id: id,
      user: userId,
    });

    if (!existing) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    const updates = normalizeData(getAllowedFields(req.body));

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        message: "Provide at least one valid field to update.",
      });
    }

    const kind = resolveKind(updates, existing);

    if (!["standard", "goal_contribution"].includes(kind)) {
      return res.status(400).json({
        message: "Invalid transaction kind.",
      });
    }

    const prepared = await prepareContribution(
      updates,
      userId,
      kind,
      existing
    );

    if (!prepared.ok) {
      return res.status(400).json({
        message: prepared.message,
      });
    }

    updates.transactionKind = kind;

    if (kind === "goal_contribution") {
      updates.category = "Goal Contribution";
      updates.goal = prepared.goal._id;
      updates.type = "expense";

      if (
        String(prepared.goal._id) !== String(existing.goal) &&
        updates.title === undefined
      ) {
        updates.title = `Contribution to ${prepared.goal.name}`;
      }
    } else {
      updates.goal = null;

      // When converting a contribution into an ordinary transaction,
      // give it a normal category if the UI didn't supply one.
      if (
        isContribution(existing) &&
        updates.category === undefined
      ) {
        updates.category = "Other";
      }

      if (updates.category === "Goal Contribution") {
        return res.status(400).json({
          message: "Select a savings goal for a goal contribution.",
        });
      }
    }

    const finalData = {
      ...existing.toObject(),
      ...updates,
    };

    const errors = validateData(finalData, {
      contribution: kind === "goal_contribution",
    });

    if (errors.length) {
      return res.status(400).json({
        message: errors[0],
        errors,
      });
    }

    const validAccount = await validateAccountOwnership(
      finalData.account,
      userId
    );

    if (!validAccount) {
      return res.status(400).json({
        message: "Account not found, archived, or not owned by you.",
      });
    }

    const oldContribution = isContribution(existing);
    const newContribution = kind === "goal_contribution";

    const oldGoalId = oldContribution
      ? String(existing.goal)
      : null;

    const newGoalId = newContribution
      ? String(finalData.goal)
      : null;

    const oldAmount = Number(existing.amount);
    const newAmount = Number(finalData.amount);

    const updated = await Transaction.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    transactionUpdated = true;

    if (
      oldContribution &&
      newContribution &&
      oldGoalId === newGoalId
    ) {
      // Same goal: apply only the amount difference.
      const delta = newAmount - oldAmount;

      if (Math.abs(delta) > 0.000001) {
        await applyGoalDelta(existing.goal, userId, delta);

        appliedDeltas.push({
          goalId: existing.goal,
          delta,
        });
      }
    } else {
      // Reverse the old contribution before applying the new one.
      if (oldContribution) {
        const delta = -oldAmount;

        await applyGoalDelta(existing.goal, userId, delta);

        appliedDeltas.push({
          goalId: existing.goal,
          delta,
        });
      }

      if (newContribution) {
        const delta = newAmount;

        await applyGoalDelta(updated.goal, userId, delta);

        appliedDeltas.push({
          goalId: updated.goal,
          delta,
        });
      }
    }

    const result = await populateTransaction(
      Transaction.findOne({
        _id: updated._id,
        user: userId,
      })
    ).lean();

    return res.status(200).json({
      message: "Transaction updated successfully.",
      transaction: result,
    });
  } catch (error) {
    console.error("Update transaction error:", error);

    // Best-effort rollback if a goal update failed after the transaction
    // document was updated.
    try {
      if (transactionUpdated && existing) {
        await Transaction.updateOne(
          {
            _id: existing._id,
            user: getUserId(req),
          },
          {
            $set: {
              title: existing.title,
              amount: existing.amount,
              type: existing.type,
              category: existing.category,
              date: existing.date,
              paymentMethod: existing.paymentMethod,
              note: existing.note,
              account: existing.account ?? null,
              goal: existing.goal ?? null,
              transactionKind:
                existing.transactionKind || "standard",
            },
          }
        );
      }

      for (const applied of [...appliedDeltas].reverse()) {
        await applyGoalDelta(
          applied.goalId,
          getUserId(req),
          -applied.delta
        );
      }
    } catch (rollbackError) {
      console.error("Transaction rollback error:", rollbackError);
    }

    if (
      error.name === "ValidationError" ||
      /goal|savings/i.test(error.message || "")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Unable to update transaction.",
    });
  }
};

const deleteTransaction = async (req, res) => {
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
        message: "Invalid transaction ID.",
      });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      user: userId,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    const deleted = await Transaction.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    try {
      if (isContribution(transaction)) {
        await applyGoalDelta(
          transaction.goal,
          userId,
          -Number(transaction.amount)
        );
      }
    } catch (error) {
      // Restore the record if reversing goal progress fails.
      await Transaction.create(transaction.toObject());
      throw error;
    }

    return res.status(200).json({
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);

    if (/goal|savings/i.test(error.message || "")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Unable to delete transaction.",
    });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
