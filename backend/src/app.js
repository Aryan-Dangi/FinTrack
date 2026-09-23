require('dotenv').config(); // If you're using a .env file
const express = require('express');
const cors = require('cors');
const authRoutes = require("./routes/authRoutes");
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.get("/api/health",(req,res)=>{
  res.json({
    status: "OK",
    message: "FinTrack Backend Running"
  })
})

module.exports = app