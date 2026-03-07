const router = require("express").Router();
const { signup, login } = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login", login);

// return current logged user
router.get("/me", auth, (req, res) => {
  res.json({ userId: req.user.id });
});

module.exports = router;