
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Transaction must belong to a user"],
      index: true,
    },

    // Optional for backward compatibility with existing transactions.
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Transaction title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },

    type: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: {
        values: ["income", "expense"],
        message: "Type must be income or expense",
      },
    },

    category: {
      type: String,
      required: [true, "Transaction category is required"],
      trim: true,
      maxlength: [50, "Category cannot exceed 50 characters"],
    },

    date: {
      type: Date,
      required: [true, "Transaction date is required"],
      default: Date.now,
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank_transfer", "upi", "other"],
      default: "other",
    },

    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, account: 1, date: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
