const mongoose = require("mongoose");
async function connectDB(){
    try {
        await mongoose.connect("mongodb://localhost:27017/openquiz");
        console.log("MongoDB connected");
        
    } catch (error) {
        console.log("error connected");
        console.log(error.message);
        process.exit(1);
    }
}
module.exports = connectDB;