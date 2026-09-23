const express = require("express");

const validate = require("../middlewares/validate");
const { signupSchema, loginSchema } = require("../validators/authValidator");

const { signup } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);

module.exports = router;