
const Transaction = require("../models/Transaction");

const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // Calendar month in UTC. Use the same boundaries for every monthly metric.
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    );

    const [result] = await Transaction.aggregate([
      {
        $match: {
          user: userId,
        },
      },
      {
        $facet: {
          allTime: [
            {
              $group: {
                _id: "$type",
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
          monthly: [
            {
              $match: {
                date: {
                  $gte: monthStart,
                  $lt: nextMonthStart,
                },
              },
            },
            {
              $group: {
                _id: "$type",
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
          recentTransactions: [
            { $sort: { date: -1, createdAt: -1, _id: -1 } },
            { $limit: 5 },
            {
              $project: {
                title: 1,
                amount: 1,
                type: 1,
                category: 1,
                date: 1,
                paymentMethod: 1,
                note: 1,
              },
            },
          ],
        },
      },
    ]);

    const sumByType = (rows) => {
      const totals = {
        income: 0,
        expenses: 0,
        count: 0,
      };

      for (const row of rows) {
        totals.count += row.count || 0;

        if (row._id === "income") {
          totals.income = row.total;
        } else if (row._id === "expense") {
          totals.expenses = row.total;
        }
      }

      return totals;
    };

    const allTime = sumByType(result?.allTime || []);
    const monthly = sumByType(result?.monthly || []);

    return res.status(200).json({
      summary: {
        totalIncome: allTime.income,
        totalExpenses: allTime.expenses,
        netCashFlow: allTime.income - allTime.expenses,
        transactionCount: allTime.count,
        monthlyIncome: monthly.income,
        monthlyExpenses: monthly.expenses,
        monthlyNetCashFlow: monthly.income - monthly.expenses,
        monthlyTransactionCount: monthly.count,
      },
      recentTransactions: result?.recentTransactions || [],
      period: {
        monthStart: monthStart.toISOString(),
        nextMonthStart: nextMonthStart.toISOString(),
        timezone: "UTC",
      },
    });
  } catch (error) {
    console.error("Get dashboard summary error:", error);

    return res.status(500).json({
      message: "Unable to retrieve dashboard data.",
    });
  }
};

module.exports = { getDashboardSummary };
