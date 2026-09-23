const express = require("express");

const validate = require("../middlewares/validate");
const { signupSchema, loginSchema } = require("../validators/authValidator");

const router = express.Router();

// Placeholder controllers for now
router.post("/signup", validate(signupSchema), (req, res) => {
  res.json({
    success: true,
    message: "Signup validation passed",
    body: req.body,
  });
});

router.post("/login", validate(loginSchema), (req, res) => {
  res.json({
    success: true,
    message: "Login validation passed",
    body: req.body,
  });
});

module.exports = router;