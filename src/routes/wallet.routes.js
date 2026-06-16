const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  getMyWallet,
  creditWallet,
  setWalletPin,
  createAddMoneySession,
  getAddMoneyQuote,
  convertWalletBalance,
  confirmAddMoney
} = require("../controllers/wallet.controller");

router.get("/balance", auth, getMyWallet);
router.post("/credit", auth, creditWallet);
router.post("/pin", auth, setWalletPin);

// Stripe add-money placeholders
router.post("/add-money/create-session", auth, createAddMoneySession);
router.post("/add-money/quote", auth, getAddMoneyQuote);
router.post("/add-money/confirm", auth, confirmAddMoney);
router.post("/convert/quote", auth, getAddMoneyQuote);
router.post("/convert", auth, convertWalletBalance);

module.exports = router;
