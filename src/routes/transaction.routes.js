const router = require("express").Router();
const auth = require("../middleware/auth");
const { sendMoney } = require("../controllers/transaction.controller");

router.post("/send", auth, sendMoney);

module.exports = router;