
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Transfer = require("../models/Transfer");
const GoalContribution = require("../models/GoalContribution");

const getAccountBalances = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const accounts = await Account.find({
      user: userId,
      isArchived: false,
    }).sort({ createdAt: -1 });

    if (accounts.length === 0) {
      return res.status(200).json({
        accounts: [],
        summary: {
          openingBalance: 0,
          income: 0,
          expenses: 0,
          goalContributions: 0,
          legacyGoalContributions: 0,
          transfersIn: 0,
          transfersOut: 0,
          currentBalance: 0,
          accountCount: 0,
        },
        note: "No active accounts found.",
      });
    }

    const accountIds = accounts.map((account) => account._id);

    const [
      transactionTotals,
      transferTotals,
      legacyContributionRecords,
    ] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            account: { $in: accountIds },
          },
        },
        {
          $group: {
            _id: {
              account: "$account",
              type: "$type",
              transactionKind: {
                $ifNull: ["$transactionKind", "standard"],
              },
            },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      Transfer.aggregate([
        {
          $match: {
            user: userId,
            $or: [
              { fromAccount: { $in: accountIds } },
              { toAccount: { $in: accountIds } },
            ],
          },
        },
        {
          $project: {
            entries: [
              {
                account: "$fromAccount",
                direction: "outgoing",
                amount: "$amount",
              },
              {
                account: "$toAccount",
                direction: "incoming",
                amount: "$amount",
              },
            ],
          },
        },
        { $unwind: "$entries" },
        {
          $match: {
            "entries.account": { $in: accountIds },
          },
        },
        {
          $group: {
            _id: {
              account: "$entries.account",
              direction: "$entries.direction",
            },
            total: { $sum: "$entries.amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      GoalContribution.find({
        user: userId,
        account: { $in: accountIds },
      })
        .select("_id goal account amount date note createdAt")
        .lean(),
    ]);

    const totalsByAccount = new Map();

    for (const account of accounts) {
      totalsByAccount.set(String(account._id), {
        income: 0,
        expenses: 0,
        goalContributions: 0,
        legacyGoalContributions: 0,
        transactionCount: 0,
        transfersIn: 0,
        transfersOut: 0,
        transferCount: 0,
      });
    }

    // Track contribution transactions so we can avoid deducting the same
    // contribution again when its legacy record has been migrated.
    const contributionTransactions = await Transaction.find({
      user: userId,
      account: { $in: accountIds },
      transactionKind: "goal_contribution",
    })
      .select("_id goal account amount date note createdAt")
      .lean();

    const migratedLegacyIds = new Set();

    const sameContribution = (legacy, transaction) => {
      if (
        String(legacy.goal) !== String(transaction.goal) ||
        String(legacy.account) !== String(transaction.account) ||
        Number(legacy.amount) !== Number(transaction.amount)
      ) {
        return false;
      }

      // Prefer matching creation times where available. This helps distinguish
      // repeated contributions with the same amount on different dates.
      if (legacy.createdAt && transaction.createdAt) {
        return (
          Math.abs(
            new Date(legacy.createdAt).getTime() -
              new Date(transaction.createdAt).getTime()
          ) <= 5000
        );
      }

      const legacyDate = new Date(legacy.date).getTime();
      const transactionDate = new Date(transaction.date).getTime();

      return Math.abs(legacyDate - transactionDate) <= 1000;
    };

    for (const legacy of legacyContributionRecords) {
      const migrated = contributionTransactions.find(
        (transaction) =>
          !migratedLegacyIds.has(String(legacy._id)) &&
          sameContribution(legacy, transaction)
      );

      if (migrated) {
        migratedLegacyIds.add(String(legacy._id));
      } else {
        const data = totalsByAccount.get(String(legacy.account));

        if (data) {
          data.legacyGoalContributions += Number(legacy.amount || 0);
        }
      }
    }

    for (const row of transactionTotals) {
      const data = totalsByAccount.get(String(row._id.account));

      if (!data) continue;

      data.transactionCount += row.count;

      if (row._id.transactionKind === "goal_contribution") {
        data.goalContributions += row.total;
      } else if (row._id.type === "income") {
        data.income += row.total;
      } else if (row._id.type === "expense") {
        data.expenses += row.total;
      }
    }

    for (const row of transferTotals) {
      const data = totalsByAccount.get(String(row._id.account));

      if (!data) continue;

      if (row._id.direction === "incoming") {
        data.transfersIn += row.total;
      } else if (row._id.direction === "outgoing") {
        data.transfersOut += row.total;
      }

      data.transferCount += row.count;
    }

    const result = accounts.map((account) => {
      const data = totalsByAccount.get(String(account._id));

      const openingBalance = Number(account.openingBalance || 0);

      const currentBalance =
        openingBalance +
        data.income -
        data.expenses -
        data.goalContributions -
        data.legacyGoalContributions +
        data.transfersIn -
        data.transfersOut;

      return {
        ...account.toObject(),
        income: data.income,
        expenses: data.expenses,
        goalContributions: data.goalContributions,
        legacyGoalContributions: data.legacyGoalContributions,
        transactionCount: data.transactionCount,
        transfersIn: data.transfersIn,
        transfersOut: data.transfersOut,
        transferCount: data.transferCount,
        currentBalance,
      };
    });

    const summary = result.reduce(
      (acc, account) => {
        acc.openingBalance += Number(account.openingBalance || 0);
        acc.income += account.income;
        acc.expenses += account.expenses;
        acc.goalContributions += account.goalContributions;
        acc.legacyGoalContributions += account.legacyGoalContributions;
        acc.transfersIn += account.transfersIn;
        acc.transfersOut += account.transfersOut;
        acc.currentBalance += account.currentBalance;
        acc.accountCount += 1;

        return acc;
      },
      {
        openingBalance: 0,
        income: 0,
        expenses: 0,
        goalContributions: 0,
        legacyGoalContributions: 0,
        transfersIn: 0,
        transfersOut: 0,
        currentBalance: 0,
        accountCount: 0,
      }
    );

    return res.status(200).json({
      accounts: result,
      summary,
      note:
        "Goal contributions are deducted from linked accounts separately from ordinary expenses. Legacy contributions matching migrated transaction records are not deducted twice.",
    });
  } catch (error) {
    console.error("Get account balances error:", error);

    return res.status(500).json({
      message: "Unable to calculate account balances.",
    });
  }
};

module.exports = { getAccountBalances };
