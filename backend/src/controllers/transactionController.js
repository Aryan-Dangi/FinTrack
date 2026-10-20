
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");

const getAuthenticatedUserId = (req) =>
  req.user?._id || req.user?.id;

const allowedFields = [
  "title",
  "amount",
  "type",
  "category",
  "date",
  "paymentMethod",
  "note",
  "account",
];

const paymentMethods = [
  "cash",
  "card",
  "bank_transfer",
  "upi",
  "other",
];

const validateTransactionData = (data, isUpdate = false) => {
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
    const amount = Number(data.amount);

    if (
      data.amount === "" ||
      data.amount === null ||
      data.amount === undefined ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      errors.push("Amount must be a number greater than zero.");
    }
  }

  if (!isUpdate || data.type !== undefined) {
    if (!["income", "expense"].includes(data.type)) {
      errors.push("Type must be income or expense.");
    }
  }

  if (!isUpdate || data.category !== undefined) {
    if (
      typeof data.category !== "string" ||
      !data.category.trim() ||
      data.category.trim().length > 50
    ) {
      errors.push("Category is required and cannot exceed 50 characters.");
    }
  }

  if (data.date !== undefined) {
    if (
      typeof data.date !== "string" ||
      !data.date.trim() ||
      !Number.isFinite(Date.parse(data.date))
    ) {
      errors.push("Please provide a valid transaction date.");
    }
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
    (typeof data.account !== "string" ||
      !mongoose.isValidObjectId(data.account))
  ) {
    errors.push("Invalid account ID.");
  }

  return errors;
};

const getAllowedFields = (body) => {
  const result = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      result[field] = body[field];
    }
  }

  return result;
};

const normalizeTransactionData = (data) => {
  if (data.title !== undefined) data.title = data.title.trim();
  if (data.category !== undefined) data.category = data.category.trim();
  if (data.amount !== undefined) data.amount = Number(data.amount);
  if (data.note !== undefined) data.note = data.note.trim();
  if (data.date !== undefined) data.date = new Date(data.date);

  if (data.account === "") data.account = null;

  return data;
};

const validateAccountOwnership = async (accountId, userId) => {
  // null means explicitly unassigned.
  if (accountId === null || accountId === "") return true;

  if (!mongoose.isValidObjectId(accountId)) return false;

  const account = await Account.findOne({
    _id: accountId,
    user: userId,
    isArchived: false,
  }).select("_id");

  return Boolean(account);
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

const createTransaction = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const data = getAllowedFields(req.body);
    const errors = validateTransactionData(data);

    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    normalizeTransactionData(data);

    if (data.account !== undefined && data.account !== null) {
      const validAccount = await validateAccountOwnership(
        data.account,
        userId
      );

      if (!validAccount) {
        return res.status(400).json({
          message: "Account not found, archived, or not owned by you.",
        });
      }
    }

    data.user = userId;

    const transaction = await Transaction.create(data);

    return res.status(201).json({
      message: "Transaction created successfully.",
      transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Unable to create transaction.",
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    let filter;

    try {
      filter = buildTransactionFilter(req.query, userId);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const [transactions, total, summaryRows] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Transaction.countDocuments(filter),

      Transaction.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$type",
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
      count: total,
    };

    for (const row of summaryRows) {
      if (row._id === "income") summary.income = row.totalAmount;
      if (row._id === "expense") summary.expenses = row.totalAmount;
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
  try {
    const userId = getAuthenticatedUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction ID." });
    }

    const updates = getAllowedFields(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide at least one valid field to update.",
      });
    }

    const errors = validateTransactionData(updates, true);

    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    normalizeTransactionData(updates);

    if (updates.account !== undefined && updates.account !== null) {
      const validAccount = await validateAccountOwnership(
        updates.account,
        userId
      );

      if (!validAccount) {
        return res.status(400).json({
          message: "Account not found, archived, or not owned by you.",
        });
      }
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    return res.status(200).json({
      message: "Transaction updated successfully.",
      transaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Unable to update transaction.",
    });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid transaction ID." });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found." });
    }

    return res.status(200).json({
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);

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
