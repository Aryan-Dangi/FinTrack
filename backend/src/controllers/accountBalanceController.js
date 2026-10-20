const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Transfer = require("../models/Transfer");

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

    const accountIds = accounts.map((account) => account._id);

    // Sum linked income and expenses for each account.
    const transactionTotals = await Transaction.aggregate([
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
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalsByAccount = new Map();

    for (const row of transactionTotals) {
      const accountId = String(row._id.account);

      if (!totalsByAccount.has(accountId)) {
        totalsByAccount.set(accountId, {
          income: 0,
          expenses: 0,
          transactionCount: 0,
        });
      }

      const totals = totalsByAccount.get(accountId);
      totals.transactionCount += row.count;

      if (row._id.type === "income") {
        totals.income = row.total;
      }

      if (row._id.type === "expense") {
        totals.expenses = row.total;
      }
    }

    // Each transfer contributes an outgoing amount to its source
    // and an incoming amount to its destination.
    const transferTotals = await Transfer.aggregate([
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
          _id: "$entries.account",
          incoming: {
            $sum: {
              $cond: [
                { $eq: ["$entries.direction", "incoming"] },
                "$entries.amount",
                0,
              ],
            },
          },
          outgoing: {
            $sum: {
              $cond: [
                { $eq: ["$entries.direction", "outgoing"] },
                "$entries.amount",
                0,
              ],
            },
          },
          transferCount: { $sum: 1 },
        },
      },
    ]);

    const transfersByAccount = new Map();

    for (const row of transferTotals) {
      transfersByAccount.set(String(row._id), {
        incoming: row.incoming,
        outgoing: row.outgoing,
        transferCount: row.transferCount,
      });
    }

    const result = accounts.map((account) => {
      const accountId = String(account._id);

      const transactionData = totalsByAccount.get(accountId) || {
        income: 0,
        expenses: 0,
        transactionCount: 0,
      };

      const transferData = transfersByAccount.get(accountId) || {
        incoming: 0,
        outgoing: 0,
        transferCount: 0,
      };

      const currentBalance =
        account.openingBalance +
        transactionData.income -
        transactionData.expenses +
        transferData.incoming -
        transferData.outgoing;

      return {
        ...account.toObject(),
        income: transactionData.income,
        expenses: transactionData.expenses,
        transactionCount: transactionData.transactionCount,
        transfersIn: transferData.incoming,
        transfersOut: transferData.outgoing,
        transferCount: transferData.transferCount,
        currentBalance,
      };
    });

    const summary = result.reduce(
      (acc, account) => {
        acc.openingBalance += account.openingBalance;
        acc.income += account.income;
        acc.expenses += account.expenses;
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
        transfersIn: 0,
        transfersOut: 0,
        currentBalance: 0,
        accountCount: 0,
      }
    );

    return res.status(200).json({
      accounts: result,
      summary,
      note: "Balances include linked transactions and transfers between active accounts.",
    });
  } catch (error) {
    console.error("Get account balances error:", error);

    return res.status(500).json({
      message: "Unable to calculate account balances.",
    });
  }
};

module.exports = { getAccountBalances };