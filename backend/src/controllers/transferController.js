const mongoose = require("mongoose");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const Transfer = require("../models/Transfer");

// Calculate an account's current balance from its opening balance,
// linked transactions, and previous transfers.
const calculateAccountBalance = async (account, userId) => {
  const transactionTotals = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        account: account._id,
      },
    },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
      },
    },
  ]);

  let income = 0;
  let expenses = 0;

  for (const item of transactionTotals) {
    if (item._id === "income") income = item.total;
    if (item._id === "expense") expenses = item.total;
  }

  const transferTotals = await Transfer.aggregate([
    {
      $match: {
        user: userId,
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
  ]);

  const incoming = transferTotals[0]?.incoming || 0;
  const outgoing = transferTotals[0]?.outgoing || 0;

  return account.openingBalance + income - expenses + incoming - outgoing;
};

// POST /api/transfers
const createTransfer = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const { fromAccount, toAccount, amount, date, note } = req.body;

    if (
      !mongoose.isValidObjectId(fromAccount) ||
      !mongoose.isValidObjectId(toAccount)
    ) {
      return res.status(400).json({
        message: "Select valid source and destination accounts.",
      });
    }

    if (String(fromAccount) === String(toAccount)) {
      return res.status(400).json({
        message: "Source and destination accounts must be different.",
      });
    }

    const transferAmount = Number(amount);

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        message: "Transfer amount must be greater than zero.",
      });
    }

    if (
      date !== undefined &&
      (Number.isNaN(Date.parse(date)) || !date)
    ) {
      return res.status(400).json({
        message: "Enter a valid transfer date.",
      });
    }

    if (note !== undefined && typeof note !== "string") {
      return res.status(400).json({
        message: "Note must be text.",
      });
    }

    const [source, destination] = await Promise.all([
      Account.findOne({
        _id: fromAccount,
        user: userId,
        isArchived: false,
      }),
      Account.findOne({
        _id: toAccount,
        user: userId,
        isArchived: false,
      }),
    ]);

    if (!source || !destination) {
      return res.status(404).json({
        message:
          "Source or destination account was not found or is archived.",
      });
    }

    // This basic balance rule is intended for cash, bank, and UPI accounts.
    // Credit-card liability balances need separate business logic.
    if (source.type === "credit_card" || destination.type === "credit_card") {
      return res.status(400).json({
        message:
          "Transfers involving credit-card accounts are not supported yet.",
      });
    }

    const availableBalance = await calculateAccountBalance(source, userId);

    if (transferAmount > availableBalance) {
      return res.status(400).json({
        message: `Insufficient funds. Available balance: ${availableBalance.toFixed(2)}.`,
      });
    }

    const transfer = await Transfer.create({
      user: userId,
      fromAccount: source._id,
      toAccount: destination._id,
      amount: transferAmount,
      date: date || new Date(),
      note: (note || "").trim(),
    });

    const populatedTransfer = await Transfer.findOne({
      _id: transfer._id,
      user: userId,
    })
      .populate("fromAccount", "name type")
      .populate("toAccount", "name type");

    return res.status(201).json({
      message: "Transfer created successfully.",
      transfer: populatedTransfer,
    });
  } catch (error) {
    console.error("Create transfer error:", error);

    return res.status(500).json({
      message: "Unable to create transfer.",
    });
  }
};

// GET /api/transfers
const getTransfers = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const filter = { user: userId };

    if (req.query.account) {
      if (!mongoose.isValidObjectId(req.query.account)) {
        return res.status(400).json({
          message: "Invalid account ID.",
        });
      }

      filter.$or = [
        { fromAccount: req.query.account },
        { toAccount: req.query.account },
      ];
    }

    const transfers = await Transfer.find(filter)
      .populate("fromAccount", "name type")
      .populate("toAccount", "name type")
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      transfers,
      count: transfers.length,
    });
  } catch (error) {
    console.error("Get transfers error:", error);

    return res.status(500).json({
      message: "Unable to load transfers.",
    });
  }
};

// DELETE /api/transfers/:id
// Removing the transfer record reverses its effect on calculated balances.
const deleteTransfer = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid transfer ID.",
      });
    }

    const transfer = await Transfer.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!transfer) {
      return res.status(404).json({
        message: "Transfer not found.",
      });
    }

    return res.status(200).json({
      message: "Transfer deleted successfully.",
      transferId: transfer._id,
    });
  } catch (error) {
    console.error("Delete transfer error:", error);

    return res.status(500).json({
      message: "Unable to delete transfer.",
    });
  }
};

module.exports = {
  createTransfer,
  getTransfers,
  deleteTransfer,
};