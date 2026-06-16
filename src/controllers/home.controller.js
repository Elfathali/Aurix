const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const { ensureWalletBalances, normalizeBalances } = require("../services/walletBalance.service");

const getStartOfToday = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
};

const parseConvertedCurrency = (tx) => {
    if (tx.toCurrency) return tx.toCurrency;

    const match = String(tx.note || "").match(/\bto\s+[\d,.]+\s+([A-Z]{3})\b/i);
    return match?.[1]?.toUpperCase() || "";
};

const calculateDailyChanges = async (userId, balances) => {
    const todayTransactions = await Transaction.find({
        status: "approved",
        createdAt: { $gte: getStartOfToday() },
        $or: [
            { fromUser: userId },
            { toUser: userId }
        ]
    });

    const netToday = {};
    for (const currency of Object.keys(balances)) {
        netToday[currency] = 0;
    }

    for (const tx of todayTransactions) {
        const fromUserId = tx.fromUser ? String(tx.fromUser) : "";
        const toUserId = tx.toUser ? String(tx.toUser) : "";
        const currentUserId = String(userId);
        const currency = String(tx.currency || tx.fromCurrency || "EUR").toUpperCase();

        if (tx.type === "convert" && fromUserId === currentUserId && toUserId === currentUserId) {
            const fromCurrency = String(tx.fromCurrency || currency).toUpperCase();
            const toCurrency = parseConvertedCurrency(tx);

            netToday[fromCurrency] = (netToday[fromCurrency] || 0) - Number(tx.amount || 0);

            if (toCurrency) {
                netToday[toCurrency] = (netToday[toCurrency] || 0) + Number(tx.convertedAmount || 0);
            }

            continue;
        }

        if (toUserId === currentUserId) {
            netToday[currency] = (netToday[currency] || 0) + Number(tx.amount || 0);
        }

        if (fromUserId === currentUserId) {
            netToday[currency] = (netToday[currency] || 0) - Number(tx.amount || 0);
        }
    }

    return Object.fromEntries(
        Object.entries(balances).map(([currency, currentBalance]) => {
            const net = Math.round(Number(netToday[currency] || 0) * 100) / 100;
            const openingBalance = Number(currentBalance || 0) - net;
            const percent = openingBalance > 0
                ? Math.round((net / openingBalance) * 1000) / 10
                : net > 0
                    ? 100
                    : 0;

            return [currency, {
                net,
                percent,
                openingBalance: Math.round(openingBalance * 100) / 100
            }];
        })
    );
};

exports.home = async (req, res) => {
    try {
        // wallet total balance
            console.log("Home controller - user:", req.user);
            const user_wallet = await Wallet.findOne({ userId: req.user.id });
            if (!user_wallet) return res.status(404).json({ message: "Wallet not found" });
            ensureWalletBalances(user_wallet);
            await user_wallet.save();
            const balances = normalizeBalances(user_wallet);
            const dailyChanges = await calculateDailyChanges(req.user.id, balances);
        // transaction recent activity (last 5 transactions)
            let recent_transactions = {received: [], sent: []};
            recent_transactions.received = await Transaction.find({ toUser: req.user.id }).sort({ createdAt: -1 }).limit(5);
            recent_transactions.sent = await Transaction.find({ fromUser: req.user.id }).sort({ createdAt: -1 }).limit(5);
            // send response
            res.json({
                wallet_balance: user_wallet.balance,
                balances,
                dailyChanges,
                transactions: recent_transactions
            });
    } catch (error) {
        console.error("Error in home controller:", error);
        res.status(500).json({ message: "something went wrong" });
    }
}
