const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        email:{type: String , unique: true , required: true , lowercase: true, trim: true },
        passwordHash: { type: String, required: true }
    },
    { timesstamps:true } 
);
module.exports = mongoose.model("User",userSchema);