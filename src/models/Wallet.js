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
        balances: {
            EUR: { type: Number, default: 0 },
            USD: { type: Number, default: 0 },
            GBP: { type: Number, default: 0 },
            NGN: { type: Number, default: 0 },
            GHS: { type: Number, default: 0 },
            KES: { type: Number, default: 0 }
        },
        code: { type: String, default: "" },
        pinHash: { type: String, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
