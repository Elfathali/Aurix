const mongoose = require("mongoose");

const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
<<<<<<< HEAD

const {
  checkFraud
} = require("../services/aiCheck.service");
=======
const { checkFraud } = require("../services/aiCheck.service");
const { get } = require("mongoose");
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a


/*
NOTES:
- For simplicity, the AI fraud check is mocked and not actually called. In a real implementation, you would call the AI service and handle its response accordingly.
- For production use, we need to implement proper transaction management to ensure atomicity, especially when updating wallet balances. This might involve using MongoDB transactions or a more robust database solution.
*/
exports.sendMoney = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const {
      toUsername,
      walletCode,
      amount,
      currency = "USD",
      device_id = "web",
      location = "DE"
    } = req.body;

    const amt = Number(amount);

<<<<<<< HEAD
    // Validate input
    if (!toEmail || !amt || amt <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        message: "toEmail and valid amount required"
      });
=======
    if ((!toUsername && !walletCode) || !amt || amt <= 0) {
      return res.status(400).json({ message: "toUsername or walletCode and valid amount required" });
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a
    }

    const fromUserId = req.user.id;

<<<<<<< HEAD
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
=======
    const fromWallet = await Wallet.findOne({ userId: fromUserId });
    const toWallet = !toUsername ? await getUserWalletByCode(walletCode) : await getUserWalletByUsername(toUsername);
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a

    if (!fromWallet || !toWallet) {

      await session.abortTransaction();

      return res.status(404).json({
        message: "Wallet not found"
      });
    }
    if (String(toWallet.userId) === String(fromUserId)) {
      return res.status(400).json({ message: "Cannot send money to yourself" });
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
<<<<<<< HEAD

      aiResult = await checkFraud({
        userId: fromUserId,
        amount: amt,
        currency,
        device_id,
        location
      });

=======
      // aiResult = await checkFraud({
      //   userId: fromUserId,
      //   amount: amt,
      //   currency,
      //   device_id,
      //   location
      // });
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a
    } catch (err) {

      await session.abortTransaction();

      return res.status(500).json({
        error: "AI_CALL_FAILED"
      });
    }

<<<<<<< HEAD
    const {
      risk_score,
      decision,
      reasons
    } = aiResult;
=======
    // const { risk_score, decision, reasons } = aiResult;
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a

    // Create transaction record
    const tx = await Transaction.create([{
      fromUser: fromUserId,
      toUser: toWallet.userId,
      amount: amt,
<<<<<<< HEAD
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
=======
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
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a
    });

  } catch (err) {
<<<<<<< HEAD

    console.error(err);

    await session.abortTransaction();

    return res.status(500).json({
      message: "Internal server error"
    });

  } finally {

    session.endSession();
=======
    console.error("Error in sendMoney controller:", err);
    return res.status(500).json({ message: "Internal server error" });
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a
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