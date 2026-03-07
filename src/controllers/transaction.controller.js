const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { checkFraud } = require("../services/aiCheck.service");

exports.sendMoney = async (req, res) => {
  try {
    const {
      toEmail,
      amount,
      currency = "EUR",
      device_id = "web",
      location = "DE"
    } = req.body;

    const amt = Number(amount);

    if (!toEmail || !amt || amt <= 0) {
      return res.status(400).json({ message: "toEmail and valid amount required" });
    }

    const fromUserId = req.user.id;

    const toUser = await User.findOne({ email: toEmail.toLowerCase() });
    if (!toUser) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    if (String(toUser._id) === String(fromUserId)) {
      return res.status(400).json({ message: "Cannot send money to yourself" });
    }

    const fromWallet = await Wallet.findOne({ userId: fromUserId });
    const toWallet = await Wallet.findOne({ userId: toUser._id });

    if (!fromWallet || !toWallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (fromWallet.balance < amt) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    let aiResult;
    try {
      aiResult = await checkFraud({
        userId: fromUserId,
        amount: amt,
        currency,
        device_id,
        location
      });
    } catch (err) {
      return res.status(500).json({ error: "AI_CALL_FAILED" });
    }

    const { risk_score, decision, reasons } = aiResult;

    const tx = await Transaction.create({
      fromUser: fromUserId,
      toUser: toUser._id,
      amount: amt,
      fraudScore: risk_score,
      reason: Array.isArray(reasons) ? reasons.join(", ") : String(reasons || ""),
      status: decision === "BLOCK" || decision === "REVIEW" ? "rejected" : "approved"
    });

    if (decision === "BLOCK" || decision === "REVIEW") {
      return res.json({
        status: "NOT_EXECUTED",
        decision,
        risk_score,
        reasons,
        tx
      });
    }

    fromWallet.balance -= amt;
    toWallet.balance += amt;

    await fromWallet.save();
    await toWallet.save();

    return res.json({
      status: "EXECUTED",
      decision,
      risk_score,
      reasons,
      tx
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};