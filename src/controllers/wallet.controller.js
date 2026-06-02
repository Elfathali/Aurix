const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.getMyWallet = async (req, res) => {

  try {

    const wallet = await Wallet.findOne({
  userId: req.user.id
});

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    return res.json({
      balance: wallet.balance,
      currency: wallet.currency || "EUR"
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.creditWallet = async (req, res) => {

  try {

    const userId = req.user.id;
    const { amount } = req.body;

    const amt = Number(amount);

    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({
        message: "userId and valid amount are required"
      });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amt } },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    // Optional transaction log
    await Transaction.create({
     fromUser: userId,
     toUser: userId,
     amount: amt,
     type: "credit",
     status: "approved"
});

    return res.json({
      message: "Wallet credited",
      wallet
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Stripe placeholder
exports.createAddMoneySession = async (req, res) => {

  try {

    const { amount } = req.body;

    const amt = Number(amount);

    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({
        message: "Valid amount is required"
      });
    }

    return res.json({
      message: "Stripe session creation placeholder",
      amount: amt,
      note: "Replace with Stripe checkout session"
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Confirm payment after Stripe success
exports.confirmAddMoney = async (req, res) => {

  try {

    const { amount } = req.body;

    const amt = Number(amount);

    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({
        message: "Valid amount is required"
      });
    }

    // IMPORTANT:
    // Real implementation must verify Stripe payment first

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user.id },
      { $inc: { balance: amt } },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    await Transaction.create({
      toUser: req.user.id,
      amount: amt,
      type: "deposit",
      status: "approved"
    });

    return res.json({
      message: "Add money confirmed",
      wallet
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};