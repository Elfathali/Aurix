const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { checkFraud } = require("../services/aiCheck.service");
const { get } = require("mongoose");


/*
NOTES:
- For simplicity, the AI fraud check is mocked and not actually called. In a real implementation, you would call the AI service and handle its response accordingly.
- For production use, we need to implement proper transaction management to ensure atomicity, especially when updating wallet balances. This might involve using MongoDB transactions or a more robust database solution.
*/
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
      return res.status(400).json({ message: "toUsername or walletCode and valid amount required" });
    }

    const fromUserId = req.user.id;

    const fromWallet = await Wallet.findOne({ userId: fromUserId });
    const toWallet = !toUsername ? await getUserWalletByCode(walletCode) : await getUserWalletByUsername(toUsername);

    if (!fromWallet || !toWallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    if (String(toWallet.userId) === String(fromUserId)) {
      return res.status(400).json({ message: "Cannot send money to yourself" });
    }

    if (fromWallet.balance < amt) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    let aiResult;
    try {
      // aiResult = await checkFraud({
      //   userId: fromUserId,
      //   amount: amt,
      //   currency,
      //   device_id,
      //   location
      // });
    } catch (err) {
      return res.status(500).json({ error: "AI_CALL_FAILED" });
    }

    // const { risk_score, decision, reasons } = aiResult;

    const tx = await Transaction.create({
      fromUser: fromUserId,
      toUser: toWallet.userId,
      amount: amt,
      // fraudScore: risk_score,
      // reason: Array.isArray(reasons) ? reasons.join(", ") : String(reasons || ""),
      // status: decision === "BLOCK" || decision === "REVIEW" ? "rejected" : "approved"
    });
    if (!tx) {
      console.error("Transaction creation failed");
      return res.status(500).json({ message: "Transaction failed" });
    }

    // if (decision === "BLOCK" || decision === "REVIEW") {
    //   return res.json({
    //     status: "NOT_EXECUTED",
    //     decision,
    //     risk_score,
    //     reasons,
    //     tx
    //   });
    // }

    fromWallet.balance -= amt;
    toWallet.balance += amt;
    try {
    await fromWallet.save();
    console.log("From wallet updated:", fromWallet);
    await toWallet.save();
    console.log("To wallet updated:", toWallet);
    } catch (err) {
      console.error("Error updating wallets:", err);
      return res.status(500).json({ message: "Failed to update wallets" });
    }

    return res.json({
      status: "EXECUTED",
      // decision,
      // risk_score,
      // reasons,
      tx
    });
  } catch (err) {
    console.error("Error in sendMoney controller:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

getUserWalletByUsername = async (username) => {
  const user = await User.findOne({ username });
  if (!user) return null;
  return await Wallet.findOne({ userId: user._id });
};
getUserWalletByCode = async (code) => {
  return await Wallet.findOne({ code });
};