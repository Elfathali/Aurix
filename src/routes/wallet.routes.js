const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  getMyWallet,
  creditWallet,
  createAddMoneySession,
  confirmAddMoney
} = require("../controllers/wallet.controller");

router.get("/me", auth, getMyWallet);
router.post("/credit", creditWallet);

// Stripe add-money placeholders
router.post("/add-money/create-session", auth, createAddMoneySession);
router.post("/add-money/confirm", auth, confirmAddMoney);

module.exports = router;