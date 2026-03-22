const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
// const mongoose = require("mongoose");

exports.getMyWallet = async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user.id });
  if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  return res.json(wallet);
};

exports.creditWallet = async (req, res) => {
  console.log("Credit wallet request body:", req.body);
  console.log("Authenticated user:", req.user);
  const userId = req.user.id;
  const { amount } = req.body;
  console.log("Credit wallet request:", { userId, amount });
  if (!userId){
    return res.status(400).json({ message: "userId is required" });
  }
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: "Valid amount is required" });
  }

  
  // in production, use mongo replica set and transactions to ensure atomicity and consistency
  /*
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: Number(amount) } },
      { new: true, session }
    );

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  const tx = await Transaction.create({
    fromUser: null,
    toUser: userId,
    amount: Number(amount)
  });
  return res.json({
    message: "Wallet credited",
    wallet,
    transaction: tx
  });
  } catch (error) {
    console.error("Error crediting wallet:", error);
    await session.abortTransaction();
    return res.status(500).json({ message: "something went wrong" });
  } finally {
    session.endSession();
  } 
  */
   try {
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: Number(amount) } },
      { new: true }
    );

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  const tx = await Transaction.create({
    fromUser: null,
    toUser: userId,
    amount: Number(amount)
  });
  console.log("Created transaction record:", tx);
  if (!tx) {
    console.error("Failed to create transaction record");
    return res.status(500).json({ message: "Failed to record transaction" });
  }

  return res.json({
    message: "Wallet credited",
    wallet,
    transaction: tx
  });
  } catch (error) {
    console.error("Error crediting wallet:", error);
    return res.status(500).json({ message: "something went wrong" });
  }
};

// Placeholder for Farrukh's Stripe integration
exports.createAddMoneySession = async (req, res) => {
  const { amount } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: "Valid amount is required" });
  }

  return res.json({
    message: "Stripe session creation placeholder",
    amount: Number(amount),
    note: "Farrukh will replace this with real Stripe checkout session logic"
  });
};

// Placeholder after payment success
exports.confirmAddMoney = async (req, res) => {
  const { amount } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: "Valid amount is required" });
  }

  const wallet = await Wallet.findOneAndUpdate(
    { userId: req.user.id },
    { $inc: { balance: Number(amount) } },
    { new: true }
  );

  if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  return res.json({
    message: "Add money confirmed",
    wallet
  });
};