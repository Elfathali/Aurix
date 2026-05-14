const router = require("express").Router();
const auth = require("../middleware/auth");
const Wallet = require("../models/Wallet");
const homeController = require("../controllers/home.controller");


router.get("/", auth, homeController.home);

module.exports = router;