const mongoose = require("mongoose");

const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const {
  checkFraud
} = require("../services/aiCheck.service");

exports.sendMoney = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const {
      toEmail,
      amount,
      currency = "EUR",
      device_id = "web",
      location = "DE"
    } = req.body;

    const amt = Number(amount);

    // Validate input
    if (!toEmail || !amt || amt <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        message: "toEmail and valid amount required"
      });
    }

    const fromUserId = req.user.id;

    // Find receiver
    const normalizedEmail = toEmail.toLowerCase();

    const toUser = await User.findOne({
      email: normalizedEmail
    });

    if (!toUser) {

      await session.abortTransaction();

      return res.status(404).json({
        message: "Receiver not found"
      });
    }

    // Prevent self-transfer
    if (String(toUser._id) === String(fromUserId)) {

      await session.abortTransaction();

      return res.status(400).json({
        message: "Cannot send money to yourself"
      });
    }

    // Find wallets
    const fromWallet = await Wallet.findOne({
      userId: fromUserId
    }).session(session);

    const toWallet = await Wallet.findOne({
      userId: toUser._id
    }).session(session);

    if (!fromWallet || !toWallet) {

      await session.abortTransaction();

      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    // Balance check
    if (fromWallet.balance < amt) {

      await session.abortTransaction();

      return res.status(400).json({
        message: "Insufficient balance"
      });
    }

    // Fraud detection
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

      await session.abortTransaction();

      return res.status(500).json({
        error: "AI_CALL_FAILED"
      });
    }

    const {
      risk_score,
      decision,
      reasons
    } = aiResult;

    // Create transaction record
    const tx = await Transaction.create([{
      fromUser: fromUserId,
      toUser: toUser._id,
      amount: amt,
      fraudScore: risk_score,
      reason: Array.isArray(reasons)
        ? reasons.join(", ")
        : String(reasons || ""),
      status:
        decision === "BLOCK" ||
        decision === "REVIEW"
          ? "rejected"
          : "approved"
    }], { session });

    // Stop transfer if fraud detected
    if (
      decision === "BLOCK" ||
      decision === "REVIEW"
    ) {

      await session.commitTransaction();

      return res.json({
        status: "NOT_EXECUTED",
        decision,
        risk_score,
        reasons,
        tx: tx[0]
      });
    }

    // Transfer money
    fromWallet.balance -= amt;
    toWallet.balance += amt;

    // Save updated wallets
    await fromWallet.save({ session });
    await toWallet.save({ session });

    // Commit everything
    await session.commitTransaction();

    return res.json({
      status: "EXECUTED",
      decision,
      risk_score,
      reasons,
      tx: tx[0]
    });

  } catch (err) {

    console.error(err);

    await session.abortTransaction();

    return res.status(500).json({
      message: "Internal server error"
    });

  } finally {

    session.endSession();
  }
};