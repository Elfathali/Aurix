const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "EUR" },
    fromCurrency: { type: String, default: "" },
    toCurrency: { type: String, default: "" },
    convertedAmount: { type: Number, default: null },
    type: { type: String, enum: ["send", "deposit", "credit", "convert"], default: "send" },
    note: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    fraudScore: { type: Number, default: null },
    reason: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
