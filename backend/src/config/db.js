const mongoose = require("mongoose");

const connectDB = async()=>{
    try{
        await mongoose.connect(process.env.DB_URI)
        console.log("Connected to DB")
    }
    catch(err){
        console.log("MongoDB connection error: ",err)
        process.exit(1)
    }
}

module.exports = connectDB;