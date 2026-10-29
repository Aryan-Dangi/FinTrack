
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

const isGoalContribution = (transaction) =>
  transaction.transactionKind === "goal_contribution" ||
  transaction.category === "Goal Contribution";

const getMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const getMonthLabel = (date) =>
  date.toLocaleString("en-US", { month: "short", year: "numeric" });

const getMonthStart = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const analyticsController = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const now = new Date();
    const currentMonthStart = getMonthStart(now);

    // Current month plus the previous five calendar months.
    const rangeStart = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );

    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: rangeStart, $lte: now },
    })
      .select("amount type category date transactionKind")
      .lean();

    const months = [];
    const monthMap = new Map();

    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - offset,
        1
      );

      const key = getMonthKey(date);

      const month = {
        month: key,
        label: getMonthLabel(date),
        income: 0,
        expenses: 0,
        goalContributions: 0,
      };

      months.push(month);
      monthMap.set(key, month);
    }

    const categoryMap = new Map();

    const totals = {
      income: 0,
      expenses: 0,
      goalContributions: 0,
    };

    let currentMonthIncome = 0;
    let currentMonthExpenses = 0;
    let currentMonthGoalContributions = 0;

    for (const transaction of transactions) {
      const amount = Number(transaction.amount);
      const date = new Date(transaction.date);

      if (!Number.isFinite(amount) || amount < 0 || Number.isNaN(date.getTime())) {
        continue;
      }

      const month = monthMap.get(getMonthKey(date));

      if (!month) continue;

      const currentMonth =
        date >= currentMonthStart && date <= now;

      if (isGoalContribution(transaction)) {
        month.goalContributions += amount;
        totals.goalContributions += amount;

        if (currentMonth) {
          currentMonthGoalContributions += amount;
        }

        continue;
      }

      if (transaction.type === "income") {
        month.income += amount;
        totals.income += amount;

        if (currentMonth) {
          currentMonthIncome += amount;
        }
      } else if (transaction.type === "expense") {
        month.expenses += amount;
        totals.expenses += amount;

        if (currentMonth) {
          currentMonthExpenses += amount;
        }

        const category =
          typeof transaction.category === "string" &&
          transaction.category.trim()
            ? transaction.category.trim()
            : "Uncategorized";

        categoryMap.set(
          category,
          (categoryMap.get(category) || 0) + amount
        );
      }
    }

    const netCashFlow = totals.income - totals.expenses;

    const savingsRate =
      totals.income > 0
        ? Number(((netCashFlow / totals.income) * 100).toFixed(2))
        : 0;

    const currentMonthNet =
      currentMonthIncome - currentMonthExpenses;

    const currentMonthSavingsRate =
      currentMonthIncome > 0
        ? Number(
            ((currentMonthNet / currentMonthIncome) * 100).toFixed(2)
          )
        : 0;

    const expenseBreakdown = [...categoryMap.entries()]
      .map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
        percentage:
          totals.expenses > 0
            ? Number(((amount / totals.expenses) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return res.status(200).json({
      success: true,
      period: {
        from: rangeStart.toISOString(),
        to: now.toISOString(),
      },
      overview: {
        income: Number(totals.income.toFixed(2)),
        expenses: Number(totals.expenses.toFixed(2)),
        netCashFlow: Number(netCashFlow.toFixed(2)),
        savingsRate,
        goalContributions: Number(
          totals.goalContributions.toFixed(2)
        ),
      },
      currentMonth: {
        income: Number(currentMonthIncome.toFixed(2)),
        expenses: Number(currentMonthExpenses.toFixed(2)),
        netCashFlow: Number(currentMonthNet.toFixed(2)),
        savingsRate: currentMonthSavingsRate,
        goalContributions: Number(
          currentMonthGoalContributions.toFixed(2)
        ),
      },
      monthlyTrends: months.map((month) => ({
        ...month,
        income: Number(month.income.toFixed(2)),
        expenses: Number(month.expenses.toFixed(2)),
        goalContributions: Number(
          month.goalContributions.toFixed(2)
        ),
      })),
      expenseBreakdown,
    });
  } catch (error) {
    console.error("Get analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve analytics.",
    });
  }
};

module.exports = { analyticsController };
