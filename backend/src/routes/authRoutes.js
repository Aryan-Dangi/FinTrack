const express = require("express");

const validate = require("../middlewares/validate");
const {
  signupSchema,
  loginSchema,
} = require("../validators/authValidator");

const {
  signup,
  login,
  getMe,
  refreshAccessToken,
  logout,
} = require("../controllers/authController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/me", protect, getMe);

router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);

module.exports = router;