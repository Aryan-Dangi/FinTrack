
const mongoose = require("mongoose");
const Account = require("../models/Account");

const allowedFields = [
  "name",
  "type",
  "openingBalance",
  "currency",
  "institution",
  "color",
  "isArchived",
];

const getUserId = (req) => req.user?._id || req.user?.id;

const validateAccountInput = (body, isUpdate = false) => {
  const errors = [];
  const input = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      input[field] = body[field];
    }
  }

  if (!isUpdate || "name" in input) {
    if (typeof input.name !== "string" || input.name.trim().length < 2) {
      errors.push("Account name must be at least 2 characters.");
    } else if (input.name.trim().length > 60) {
      errors.push("Account name cannot exceed 60 characters.");
    }
  }

  if (!isUpdate || "type" in input) {
    if (
      !["cash", "bank", "upi", "credit_card", "investment", "other"].includes(
        input.type
      )
    ) {
      errors.push("Invalid account type.");
    }
  }

  if ("openingBalance" in input) {
    if (
      typeof input.openingBalance !== "number" ||
      !Number.isFinite(input.openingBalance) ||
      input.openingBalance < 0
    ) {
      errors.push("Opening balance must be a non-negative number.");
    }
  } else if (!isUpdate) {
    input.openingBalance = 0;
  }

  if ("currency" in input && input.currency !== "INR") {
    errors.push("Only INR currency is currently supported.");
  }

  if ("institution" in input) {
    if (
      typeof input.institution !== "string" ||
      input.institution.length > 100
    ) {
      errors.push("Institution must be text with at most 100 characters.");
    }
  }

  if (
    "color" in input &&
    !["zinc", "blue", "emerald", "violet", "amber", "rose"].includes(
      input.color
    )
  ) {
    errors.push("Invalid account color.");
  }

  if ("isArchived" in input && typeof input.isArchived !== "boolean") {
    errors.push("isArchived must be a boolean.");
  }

  return { input, errors };
};

// POST /api/accounts
const createAccount = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const { input, errors } = validateAccountInput(req.body);

    if (errors.length) {
      return res.status(400).json({
        message: "Please correct the account details.",
        errors,
      });
    }

    const account = await Account.create({
      ...input,
      user: userId,
      currency: input.currency || "INR",
    });

    return res.status(201).json({
      message: "Account created successfully.",
      account,
    });
  } catch (error) {
    console.error("Create account error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Unable to create account." });
  }
};

// GET /api/accounts
const getAccounts = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const { includeArchived } = req.query;
    const filter = { user: userId };

    if (includeArchived !== "true") {
      filter.isArchived = false;
    }

    const accounts = await Account.find(filter).sort({
      createdAt: -1,
      _id: -1,
    });

    return res.status(200).json({
      count: accounts.length,
      accounts,
    });
  } catch (error) {
    console.error("Get accounts error:", error);
    return res.status(500).json({ message: "Unable to retrieve accounts." });
  }
};

// PATCH /api/accounts/:id
const updateAccount = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid account ID." });
    }

    const { input, errors } = validateAccountInput(req.body, true);

    if (errors.length) {
      return res.status(400).json({
        message: "Please correct the account details.",
        errors,
      });
    }

    if (Object.keys(input).length === 0) {
      return res.status(400).json({
        message: "Provide at least one valid field to update.",
      });
    }

    const account = await Account.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    return res.status(200).json({
      message: "Account updated successfully.",
      account,
    });
  } catch (error) {
    console.error("Update account error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Unable to update account." });
  }
};

// DELETE /api/accounts/:id
// Soft-delete by archiving to preserve historical records.
const deleteAccount = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid account ID." });
    }

    const account = await Account.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { isArchived: true } },
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    return res.status(200).json({
      message: "Account archived successfully.",
      account,
    });
  } catch (error) {
    console.error("Archive account error:", error);
    return res.status(500).json({ message: "Unable to archive account." });
  }
};

module.exports = {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
};
