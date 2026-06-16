const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const {
  adjustCurrencyBalance,
  ensureWalletBalances,
  getCurrencyBalance,
  normalizeCurrency
} = require("../services/walletBalance.service");

const {
  checkFraud
} = require("../services/aiCheck.service");

/*
NOTES:
- AI fraud check mocked for demo
- MongoDB transactions used for atomicity
*/

exports.sendMoney = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const {
      toUsername,
      walletCode,
      amount,
      pin,
      currency = "EUR",
      device_id = "web",
      location = "DE"
    } = req.body;

    const amt = Number(amount);
    const txCurrency = normalizeCurrency(currency);

    // Validate input
    if ((!toUsername && !walletCode) || !amt || amt <= 0) {

      await session.abortTransaction();

      return res.status(400).json({
        message: "Receiver and valid amount required"
      });
    }

    if (!/^\d{4}$/.test(String(pin))) {

      await session.abortTransaction();

      return res.status(400).json({
        message: "Valid 4-digit wallet PIN is required"
      });
    }

    const fromUserId = req.user.id;

    // Find receiver user
    let toUser = null;

    // Send by username
    if (toUsername) {

      toUser = await User.findOne({
        username: toUsername
      });
    }

    // Send by wallet code
    if (walletCode) {

      const wallet = await Wallet.findOne({
        code: walletCode
      });

      if (wallet) {

        toUser = await User.findById(wallet.userId);
      }
    }

    // Receiver not found
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

    ensureWalletBalances(fromWallet);
    ensureWalletBalances(toWallet);

    if (!fromWallet.pinHash) {

      await session.abortTransaction();

      return res.status(400).json({
        message: "Wallet PIN is not set"
      });
    }

    const pinOk = await bcrypt.compare(String(pin), fromWallet.pinHash);

    if (!pinOk) {

      await session.abortTransaction();

      return res.status(401).json({
        message: "Invalid wallet PIN"
      });
    }

    // Balance check
    if (getCurrencyBalance(fromWallet, txCurrency) < amt) {

      await session.abortTransaction();

      return res.status(400).json({
        message: "Insufficient balance"
      });
    }

    // AI Fraud Detection
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

    // Create transaction FIRST as pending
    const tx = await Transaction.create([{

      fromUser: fromUserId,
      toUser: toWallet.userId,
      amount: amt,
      currency: txCurrency,
      type: "send",

      fraudScore: risk_score,

      reason: Array.isArray(reasons)
        ? reasons.join(", ")
        : String(reasons || ""),

      status: "pending"

    }], { session });

    // Fraud detected
    if (
      decision === "BLOCK" ||
      decision === "REVIEW"
    ) {

      tx[0].status = "rejected";

      await tx[0].save({ session });

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
    adjustCurrencyBalance(fromWallet, txCurrency, -amt);
    adjustCurrencyBalance(toWallet, txCurrency, amt);

    // Save wallets
    await fromWallet.save({ session });
    await toWallet.save({ session });

    // Mark transaction approved
    tx[0].status = "approved";

    await tx[0].save({ session });

    // Commit transaction
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



// ==========================================
// TRANSACTION HISTORY
// ==========================================

exports.getHistory = async (req, res) => {

  try {

    const transactions = await Transaction.find({

      $or: [
        { fromUser: req.user.id },
        { toUser: req.user.id }
      ]

    })

    .populate("fromUser", "username email")
    .populate("toUser", "username email")

    .sort({ createdAt: -1 });

    return res.json(transactions);

  } catch (err) {

    return res.status(500).json({
      message: err.message
    });

  }
};


// ==========================================
// PENDING TRANSACTIONS
// ==========================================

exports.getPendingTransactions = async (req, res) => {

  try {

    const pending = await Transaction.find({

      fromUser: req.user.id,
      status: "pending"

    })

    .sort({ createdAt: -1 });

    return res.json(pending);

  } catch (err) {

    return res.status(500).json({
      message: err.message
    });

  }
};


// ==========================================
// COMPLETED TRANSACTIONS
// ==========================================

exports.getCompletedTransactions = async (req, res) => {

  try {

    const completed = await Transaction.find({

      fromUser: req.user.id,
      status: "approved"

    })

    .sort({ createdAt: -1 });

    return res.json(completed);

  } catch (err) {

    return res.status(500).json({
      message: err.message
    });

  }
};
