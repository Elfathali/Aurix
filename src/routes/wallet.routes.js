const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  getMyWallet,
  creditWallet,
  createAddMoneySession,
  confirmAddMoney
} = require("../controllers/wallet.controller");

<<<<<<< HEAD
router.get("/balance", auth, getMyWallet);
=======
router.get("/me", auth, getMyWallet);
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a
router.post("/credit", auth, creditWallet);

// Stripe add-money placeholders
router.post("/add-money/create-session", auth, createAddMoneySession);
router.post("/add-money/confirm", auth, confirmAddMoney);

module.exports = router;