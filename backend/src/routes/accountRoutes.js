
const express = require("express");
const protect = require("../middlewares/authMiddleware");

const {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
} = require("../controllers/accountController");

const {
  getAccountBalances,
} = require("../controllers/accountBalanceController");

const router = express.Router();

router.use(protect);

router.get("/balances", getAccountBalances);

router.route("/")
  .post(createAccount)
  .get(getAccounts);

router.route("/:id")
  .patch(updateAccount)
  .delete(deleteAccount);

module.exports = router;
