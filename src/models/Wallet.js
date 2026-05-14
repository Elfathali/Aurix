const mongoose = require("mongoose");
const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", unique: true,
            required: true
        },
        balance: {
            type: Number, default: 0
        },
        code: { type: String, default: "" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);