const express = require("express");

const validate = require("../middlewares/validate");
const { signupSchema, loginSchema } = require("../validators/authValidator");

const { signup,login } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", validate(signupSchema),signup);
router.post("/login",validate(loginSchema),login)
module.exports = router;