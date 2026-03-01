const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { checkFraud } = require("../services/aiCheck.service");

exports.sendMoney = async (req, res) => {
  const { toEmail, amount } = req.body;
  const amt = Number(amount);

  if (!toEmail || !amt || amt <= 0) {
    return res.status(400).json({ message: "toEmail and valid amount required" });
  }

  const fromUserId = req.user.id;
  const toUser = await User.findOne({ email: toEmail.toLowerCase() });
  if (!toUser) return res.status(404).json({ message: "Receiver not found" });

  const fromWallet = await Wallet.findOne({ userId: fromUserId });
  const toWallet = await Wallet.findOne({ userId: toUser._id });
  if (!fromWallet || !toWallet) return res.status(404).json({ message: "Wallet not found" });

  if (fromWallet.balance < amt) return res.status(400).json({ message: "Insufficient balance" });

  // ✅ 1) Call AI (mock now, real later)
  const ai = await checkFraud({ fromUser: fromUserId, toUser: toUser._id, amount: amt });

  // Create transaction record
  const tx = await Transaction.create({
    fromUser: fromUserId,
    toUser: toUser._id,
    amount: amt,
    fraudScore: ai.fraudScore,
    reason: ai.reason,
    status: ai.decision === "BLOCK" ? "rejected" : "approved"
  });

  // ✅ 2) If BLOCK → don't move money
  if (ai.decision === "BLOCK") {
    return res.status(403).json({
      status: "BLOCKED",
      message: "Transaction blocked by AI",
      ai,
      tx
    });
  }

  // ✅ 3) If APPROVE/REVIEW → for MVP you can treat REVIEW as allowed or blocked
  // MVP: treat REVIEW as allowed OR return status REVIEW and don't move money.
  if (ai.decision === "REVIEW") {
    // safest for demo:
    tx.status = "pending";
    await tx.save();
    return res.status(200).json({
      status: "REVIEW",
      message: "Transaction needs review",
      ai,
      tx
    });
  }

  // ✅ APPROVE → move money
  fromWallet.balance -= amt;
  toWallet.balance += amt;
  await fromWallet.save();
  await toWallet.save();

  return res.json({
    status: "APPROVED",
    message: "Transaction successful",
    ai,
    tx,
    balances: {
      fromBalance: fromWallet.balance,
      toBalance: toWallet.balance
    }
  });
};