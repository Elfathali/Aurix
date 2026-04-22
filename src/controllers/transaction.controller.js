const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { checkFraud } = require("../services/aiCheck.service");


exports.sendMoney = async (req, res) => {
  try {
    const {
      toUsername,
      walletCode,
      amount,
      currency = "USD",
      device_id = "web",
      location = "DE"
    } = req.body;

    const amt = Number(amount);

    if ((!toUsername && !walletCode) || !amt || amt <= 0) {
      return res.status(400).json({
        message: "toUsername or walletCode and valid amount required"
      });
    }

    const fromUserId = req.user.id;

    const fromWallet = await Wallet.findOne({ userId: fromUserId });
    const toWallet = !toUsername
      ? await getUserWalletByCode(walletCode)
      : await getUserWalletByUsername(toUsername);

    if (!fromWallet || !toWallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (String(toWallet.userId) === String(fromUserId)) {
      return res.status(400).json({ message: "Cannot send money to yourself" });
    }

    // Hard backend business rule
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
      console.error("AI fraud service call failed:", err.message);

      return res.status(500).json({
        status: "REVIEW",
        message: "Fraud service unavailable",
        ai: {
          risk_score: 50,
          decision: "REVIEW",
          reasons: ["Fraud service unavailable - routed to manual review"]
        }
      });
    }

    const { risk_score, decision, reasons } = aiResult;

    let txStatus = "pending";
    if (decision === "APPROVE") {
      txStatus = "approved";
    } else if (decision === "BLOCK") {
      txStatus = "rejected";
    }

    const tx = await Transaction.create({
      fromUser: fromUserId,
      toUser: toWallet.userId,
      amount: amt,
      fraudScore: risk_score,
      reason: Array.isArray(reasons) ? reasons.join(", ") : String(reasons || ""),
      status: txStatus
    });

    if (!tx) {
      console.error("Transaction creation failed");
      return res.status(500).json({ message: "Transaction failed" });
    }

    // REVIEW or BLOCK => do not execute transfer
    if (decision === "BLOCK" || decision === "REVIEW") {
      return res.json({
        status: "NOT_EXECUTED",
        decision,
        risk_score,
        reasons,
        tx
      });
    }

    // APPROVE => execute wallet update
    fromWallet.balance -= amt;
    toWallet.balance += amt;

    try {
      await fromWallet.save();
      await toWallet.save();
    } catch (err) {
      console.error("Error updating wallets:", err);
      return res.status(500).json({ message: "Failed to update wallets" });
    }

    return res.json({
      status: "EXECUTED",
      decision,
      risk_score,
      reasons,
      tx
    });
  } catch (err) {
    console.error("Error in sendMoney controller:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const getUserWalletByUsername = async (username) => {
  const user = await User.findOne({ username });
  if (!user) return null;
  return await Wallet.findOne({ userId: user._id });
};

const getUserWalletByCode = async (code) => {
  return await Wallet.findOne({ code });
};