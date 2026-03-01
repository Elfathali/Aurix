const Wallet = require("../models/Wallet");

exports.getMyWallet = async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.user.id });
  if (!wallet) return res.status(404).json({ message: "Wallet not found" });
  res.json(wallet);
};

exports.creditWallet = async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) return res.status(400).json({ message: "userId and amount required" });

  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { balance: Number(amount) } },
    { new: true }
  );

  if (!wallet) return res.status(404).json({ message: "Wallet not found" });
  res.json({ message: "Wallet credited", wallet });
};