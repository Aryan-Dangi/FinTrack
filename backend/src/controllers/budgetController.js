

const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

const getUserId = (req) => req.user?._id || req.user?.id;

const parseMonth = (value) => {
  if (!value) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  }

  // Accept YYYY-MM from the frontend.
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return null;
  }

  const [year, month] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, 1));
};

const getMonthRange = (month) => {
  const start = new Date(month);
  const end = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)
  );

  return { start, end };
};

const getBudgetInput = (body) => ({
  category:
    typeof body.category === "string" ? body.category.trim() : "",
  amount: body.amount,
  month: parseMonth(body.month),
  note: typeof body.note === "string" ? body.note.trim() : "",
});

const validateBudgetInput = (data) => {
  if (!data.category || data.category.length > 60) {
    return "Provide a category between 1 and 60 characters.";
  }

  if (
    data.amount === "" ||
    data.amount === null ||
    data.amount === undefined ||
    !Number.isFinite(Number(data.amount)) ||
    Number(data.amount) <= 0
  ) {
    return "Budget amount must be a number greater than zero.";
  }

  if (!data.month) {
    return "Month must be in YYYY-MM format.";
  }

  if (data.note.length > 300) {
    return "Note cannot exceed 300 characters.";
  }

  return null;
};

// GET /api/budgets?month=2026-10
const getBudgets = async (req, res) => {
  try {
    const userId = getUserId(req);
    const month = parseMonth(req.query.month);

    if (!month) {
      return res.status(400).json({
        message: "Month must be in YYYY-MM format.",
      });
    }

    const { start, end } = getMonthRange(month);

    const [budgets, spending] = await Promise.all([
      Budget.find({ user: userId, month: start })
        .sort({ category: 1 })
        .lean(),

      Transaction.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(String(userId)),
            type: "expense",
            date: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: "$category",
            spent: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const spendingByCategory = new Map(
      spending.map((item) => [
        String(item._id || "").trim().toLowerCase(),
        item.spent,
      ])
    );

    const items = budgets.map((budget) => {
      const spent =
        spendingByCategory.get(budget.category.trim().toLowerCase()) || 0;

      const amount = budget.amount;

      return {
        ...budget,
        spent,
        remaining: amount - spent,
        percentage: Math.round((spent / amount) * 100),
        isOverBudget: spent > amount,
      };
    });

    const summary = items.reduce(
      (result, budget) => {
        result.totalBudget += budget.amount;
        result.totalSpent += budget.spent;
        result.totalRemaining += budget.remaining;
        return result;
      },
      { totalBudget: 0, totalSpent: 0, totalRemaining: 0 }
    );

    return res.status(200).json({
      month: start,
      summary,
      budgets: items,
    });
  } catch (error) {
    console.error("Get budgets error:", error);

    return res.status(500).json({
      message: "Failed to fetch budgets.",
    });
  }
};

// POST /api/budgets
const createBudget = async (req, res) => {
  try {
    const userId = getUserId(req);
    const data = getBudgetInput(req.body);
    const validationError = validateBudgetInput(data);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const month = data.month;

    const budget = await Budget.create({
      user: userId,
      category: data.category,
      amount: Number(data.amount),
      month,
      note: data.note,
    });

    return res.status(201).json({
      message: "Budget created successfully.",
      budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A budget for this category and month already exists.",
      });
    }

    console.error("Create budget error:", error);

    return res.status(500).json({
      message: "Failed to create budget.",
    });
  }
};

// PATCH /api/budgets/:id
const updateBudget = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid budget ID." });
    }

    const existing = await Budget.findOne({ _id: id, user: userId });

    if (!existing) {
      return res.status(404).json({ message: "Budget not found." });
    }

    const data = getBudgetInput({
      category: req.body.category ?? existing.category,
      amount: req.body.amount ?? existing.amount,
      month:
        req.body.month ??
        `${existing.month.getUTCFullYear()}-${String(
          existing.month.getUTCMonth() + 1
        ).padStart(2, "0")}`,
      note: req.body.note ?? existing.note,
    });

    const validationError = validateBudgetInput(data);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    existing.category = data.category;
    existing.amount = Number(data.amount);
    existing.month = data.month;
    existing.note = data.note;

    await existing.save();

    return res.status(200).json({
      message: "Budget updated successfully.",
      budget: existing,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A budget for this category and month already exists.",
      });
    }

    console.error("Update budget error:", error);

    return res.status(500).json({
      message: "Failed to update budget.",
    });
  }
};

// DELETE /api/budgets/:id
const deleteBudget = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid budget ID." });
    }

    const budget = await Budget.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found." });
    }

    return res.status(200).json({
      message: "Budget deleted successfully.",
    });
  } catch (error) {
    console.error("Delete budget error:", error);

    return res.status(500).json({
      message: "Failed to delete budget.",
    });
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
