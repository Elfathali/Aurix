const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.home = async (req, res) => {
    try {
        // wallet total balance
            console.log("Home controller - user:", req.user);
            const user_wallet = await Wallet.findOne({ userId: req.user.id });
            if (!user_wallet) return res.status(404).json({ message: "Wallet not found" });
        // transaction recent activity (last 5 transactions)
            let recent_transactions = {received: [], sent: []};
            recent_transactions.received = await Transaction.find({ toUser: req.user.id }).sort({ createdAt: -1 }).limit(5);
            recent_transactions.sent = await Transaction.find({ fromUser: req.user.id }).sort({ createdAt: -1 }).limit(5);
            // send response
            res.json({ wallet_balance: user_wallet.balance, transactions: recent_transactions });
    } catch (error) {
        console.error("Error in home controller:", error);
        res.status(500).json({ message: "something went wrong" });
    }
}