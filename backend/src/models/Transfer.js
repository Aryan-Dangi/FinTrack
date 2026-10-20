const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Source account is required"],
    },

    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Destination account is required"],
    },

    amount: {
      type: Number,
      required: [true, "Transfer amount is required"],
      min: [0.01, "Transfer amount must be greater than zero"],
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
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

transferSchema.index({ user: 1, date: -1 });
transferSchema.index({ user: 1, fromAccount: 1 });
transferSchema.index({ user: 1, toAccount: 1 });

module.exports = mongoose.model("Transfer", transferSchema);