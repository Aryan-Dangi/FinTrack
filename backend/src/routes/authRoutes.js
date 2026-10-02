const express = require("express");

const validate = require("../middlewares/validate");
const { signupSchema, loginSchema } = require("../validators/authValidator");

const { signup,login,getMe } = require("../controllers/authController");

const protect = require("../middlewares/authMiddleware")
const router = express.Router();

router.post("/signup", validate(signupSchema),signup);
router.post("/login",validate(loginSchema),login)
router.get("/me",protect,getMe)
module.exports = router;  
