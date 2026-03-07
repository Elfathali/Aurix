const Wallet = require("../models/Wallet");

exports.getMyWallet = async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user.id });
  if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  return res.json(wallet);
};

exports.creditWallet = async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ message: "userId and valid amount are required" });
  }

  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: Number(amount) } },
    { new: true }
  );

  if (!wallet) return res.status(404).json({ message: "Wallet not found" });

  return res.json({
    message: "Wallet credited",
    wallet
  });
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