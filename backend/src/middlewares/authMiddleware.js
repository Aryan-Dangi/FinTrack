
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      console.error("JWT_ACCESS_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token missing.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token missing.",
      });
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof decoded.id !== "string" ||
      !mongoose.isValidObjectId(decoded.id)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    const user = await User.findById(decoded.id)
      .select("_id");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError" ||
        error.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    next(error);
  }
};

module.exports = protect;
