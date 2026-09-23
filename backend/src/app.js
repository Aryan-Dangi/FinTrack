require('dotenv').config(); // If you're using a .env file
const express = require('express');
const cors = require('cors');
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser")
const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser())
app.use("/api/auth", authRoutes);
app.get("/api/health",(req,res)=>{
  res.json({
    status: "OK",
    message: "FinTrack Backend Running"
  })
})

module.exports = app