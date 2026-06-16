const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const bcrypt = require("bcryptjs");
const {
  adjustCurrencyBalance,
  ensureWalletBalances,
  getCurrencyBalance,
  normalizeBalances
} = require("../services/walletBalance.service");
const EXCHANGE_RATES = {
  USD: { EUR: 0.92, NGN: 1500, GHS: 14.8, KES: 129 },
  EUR: { USD: 1.09, NGN: 1630, GHS: 16.1, KES: 140 },
  GBP: { USD: 1.27, EUR: 1.17, NGN: 1900, GHS: 18.8, KES: 163 },
  NGN: { USD: 0.00067, EUR: 0.00061, GHS: 0.0099, KES: 0.086 },
  GHS: { USD: 0.068, EUR: 0.062, NGN: 101, KES: 8.7 },
  KES: { USD: 0.0078, EUR: 0.0071, NGN: 11.6, GHS: 0.115 }
};

const getRate = (fromCurrency, toCurrency) => {
  const from = String(fromCurrency || "").toUpperCase();
  const to = String(toCurrency || "").toUpperCase();

  if (!from || !to) return null;
  if (from === to) return 1;

  return EXCHANGE_RATES[from]?.[to] || null;
};

const calculateQuote = ({ amount, fromCurrency, toCurrency }) => {
  const sourceAmount = Number(amount);
  const from = String(fromCurrency || "USD").toUpperCase();
  const to = String(toCurrency || "EUR").toUpperCase();
  const rate = getRate(from, to);

  if (isNaN(sourceAmount) || sourceAmount <= 0) {
    return { error: "Valid amount is required" };
  }

  if (!rate) {
    return { error: `Conversion from ${from} to ${to} is not supported` };
  }

  const convertedAmount = Math.round(sourceAmount * rate * 100) / 100;

  return {
    amount: sourceAmount,
    fromCurrency: from,
    toCurrency: to,
    rate,
    convertedAmount
  };
};

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
      balances: normalizeBalances(wallet),
      currency: wallet.currency || "EUR",
      hasPin: Boolean(wallet.pinHash)
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

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    ensureWalletBalances(wallet);
    adjustCurrencyBalance(wallet, "EUR", amt);
    await wallet.save();

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

exports.getAddMoneyQuote = async (req, res) => {
  try {
    const quote = calculateQuote(req.body);

    if (quote.error) {
      return res.status(400).json({ message: quote.error });
    }

    return res.json(quote);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
// Confirm add-money for development/manual top-up
exports.confirmAddMoney = async (req, res) => {

  try {

    const {
      amount,
      convertedAmount,
      fromCurrency = "USD",
      toCurrency = "EUR",
      note = "",
      pin
    } = req.body;

    const sourceAmount = Number(amount);
    const creditAmount = Number(convertedAmount || amount);

    if (isNaN(sourceAmount) || sourceAmount <= 0 || isNaN(creditAmount) || creditAmount <= 0) {
      return res.status(400).json({
        message: "Valid amount is required"
      });
    }

    if (!/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({
        message: "Valid 4-digit wallet PIN is required"
      });
    }

    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    if (!wallet.pinHash) {
      return res.status(400).json({
        message: "Wallet PIN is not set"
      });
    }

    const pinOk = await bcrypt.compare(String(pin), wallet.pinHash);

    if (!pinOk) {
      return res.status(401).json({
        message: "Invalid wallet PIN"
      });
    }

    ensureWalletBalances(wallet);
    adjustCurrencyBalance(wallet, toCurrency, creditAmount);
    await wallet.save();

    const tx = await Transaction.create({
      toUser: req.user.id,
      amount: creditAmount,
      currency: toCurrency,
      fromCurrency,
      convertedAmount: creditAmount,
      type: "deposit",
      note: String(note || ""),
      status: "approved"
    });

    return res.json({
      message: "Add money confirmed",
      wallet,
      transaction: tx
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

exports.convertWalletBalance = async (req, res) => {
  try {
    const {
      amount,
      fromCurrency = "EUR",
      toCurrency = "USD",
      pin
    } = req.body;

    const quote = calculateQuote({ amount, fromCurrency, toCurrency });

    if (quote.error) {
      return res.status(400).json({ message: quote.error });
    }

    if (quote.fromCurrency === quote.toCurrency) {
      return res.status(400).json({
        message: "Choose two different currencies"
      });
    }

    if (!/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({
        message: "Valid 4-digit wallet PIN is required"
      });
    }

    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (!wallet.pinHash) {
      return res.status(400).json({ message: "Wallet PIN is not set" });
    }

    const pinOk = await bcrypt.compare(String(pin), wallet.pinHash);

    if (!pinOk) {
      return res.status(401).json({ message: "Invalid wallet PIN" });
    }

    ensureWalletBalances(wallet);

    if (getCurrencyBalance(wallet, quote.fromCurrency) < quote.amount) {
      return res.status(400).json({
        message: `Insufficient ${quote.fromCurrency} balance`
      });
    }

    adjustCurrencyBalance(wallet, quote.fromCurrency, -quote.amount);
    adjustCurrencyBalance(wallet, quote.toCurrency, quote.convertedAmount);
    await wallet.save();

    const tx = await Transaction.create({
      fromUser: req.user.id,
      toUser: req.user.id,
      amount: quote.amount,
      currency: quote.fromCurrency,
      fromCurrency: quote.fromCurrency,
      toCurrency: quote.toCurrency,
      convertedAmount: quote.convertedAmount,
      type: "convert",
      note: `Converted ${quote.amount} ${quote.fromCurrency} to ${quote.convertedAmount} ${quote.toCurrency}`,
      status: "approved"
    });

    return res.json({
      message: "Currency converted",
      wallet,
      balances: normalizeBalances(wallet),
      quote,
      transaction: tx
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
exports.setWalletPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({
        message: "PIN must be exactly 4 digits"
      });
    }

    const pinHash = await bcrypt.hash(String(pin), 10);

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.user.id },
      { pinHash },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found"
      });
    }

    return res.json({
      message: "Wallet PIN set successfully"
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
