
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
      validate: {
        validator: Number.isFinite,
        message: "Target amount must be a finite number.",
      },
    },

    // Savings that existed before contribution tracking.
    initialAmount: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "Initial amount must be a finite number.",
      },
    },

    // Maintained as the total saved for compatibility.
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
      validate: [
        {
          validator: Number.isFinite,
          message: "Current amount must be a finite number.",
        },
        {
          validator(value) {
            return value >= Number(this.initialAmount || 0);
          },
          message: "Current amount cannot be less than the initial amount.",
        },
      ],
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

// A non-cancelled goal's status is derived from its saved progress. Keeping
// this invariant in the schema also protects writes that bypass controllers.
goalSchema.pre("validate", function syncGoalStatus() {
  if (this.status !== "cancelled") {
    this.status =
      Number(this.currentAmount) >= Number(this.targetAmount)
        ? "completed"
        : "active";
  }
});

goalSchema.index({ user: 1, status: 1, targetDate: 1 });

module.exports = mongoose.model("Goal", goalSchema);
