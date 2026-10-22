require('dotenv').config(); // If you're using a .env file
const express = require('express');
const cors = require('cors');
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser")
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const accountRoutes = require("./routes/accountRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const transferRoutes = require("./routes/transferRoutes");
const goalRoutes = require("./routes/goalRoutes");
const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser())
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals",goalRoutes);
app.get("/api/health",(req,res)=>{
  res.json({
    status: "OK",
    message: "FinTrack Backend Running"
  })
})

module.exports = app