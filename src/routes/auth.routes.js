const router = require("express").Router();

const { signup, login } = require("../controllers/auth.controller");

const auth = require("../middleware/auth");

router.post("/signup", signup);

router.post("/login", login);

router.get("/me", auth, async (req, res) => {
  res.json({
    userId: req.user.id
  });
});

module.exports = router;