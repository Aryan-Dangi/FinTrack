
const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Account must belong to a user"],
      index: true,
    },

    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
      minlength: [2, "Account name must be at least 2 characters"],
      maxlength: [60, "Account name cannot exceed 60 characters"],
    },

    type: {
      type: String,
      required: [true, "Account type is required"],
      enum: {
        values: ["cash", "bank", "upi", "credit_card", "investment", "other"],
        message: "Invalid account type",
      },
      default: "bank",
    },

    openingBalance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Opening balance cannot be negative"],
    },

    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: "INR",
      enum: ["INR"],
    },

    institution: {
      type: String,
      trim: true,
      maxlength: [100, "Institution name cannot exceed 100 characters"],
      default: "",
    },

    color: {
      type: String,
      default: "zinc",
      enum: [
        "zinc",
        "blue",
        "emerald",
        "violet",
        "amber",
        "rose",
      ],
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

accountSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Account", accountSchema);
