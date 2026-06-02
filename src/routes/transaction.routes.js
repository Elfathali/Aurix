const router = require("express").Router();
const auth = require("../middleware/auth");
const { sendMoney, getHistory, getPendingTransactions, getCompletedTransactions } = 
require("../controllers/transaction.controller");
router.post("/send", auth, sendMoney);

router.get("/history", auth, getHistory);

router.get("/pending", auth, getPendingTransactions);

router.get("/completed", auth, getCompletedTransactions);

module.exports = router;