const router = require("express").Router();
const auth = require("../middleware/auth");
const { getMyWallet, creditWallet } = require("../controllers/wallet.controller");

router.get("/me", auth, getMyWallet);
router.post("/credit", creditWallet);

module.exports = router;