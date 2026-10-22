
const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: [true, "Budget category is required"],
      trim: true,
      maxlength: [60, "Category cannot exceed 60 characters"],
    },

    amount: {
      type: Number,
      required: [true, "Budget amount is required"],
      min: [0.01, "Budget amount must be greater than zero"],
    },

    // Always store the first day of the selected month.
    month: {
      type: Date,
      required: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: [300, "Note cannot exceed 300 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// A user can have only one budget per category per month.
budgetSchema.index(
  { user: 1, category: 1, month: 1 },
  { unique: true }
);

budgetSchema.index({ user: 1, month: 1 });

module.exports = mongoose.model("Budget", budgetSchema);
