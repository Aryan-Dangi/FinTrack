
const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    targetAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // Savings that existed before contribution tracking.
    initialAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Maintained as the total saved for compatibility.
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    category: {
      type: String,
      enum: [
        "Emergency Fund",
        "Travel",
        "Education",
        "Vehicle",
        "Home",
        "Gadgets",
        "Investment",
        "Other",
      ],
      default: "Other",
    },

    targetDate: {
      type: Date,
      default: null,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

goalSchema.index({ user: 1, status: 1, targetDate: 1 });

module.exports = mongoose.model("Goal", goalSchema);
