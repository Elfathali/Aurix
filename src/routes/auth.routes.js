const router = require("express").Router();

const {
  signup,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  requestPhoneOtp,
  verifyPhoneOtp,
  socialLogin
} = require("../controllers/auth.controller");

const auth = require("../middleware/auth");

router.post("/signup", signup);

router.post("/login", login);

router.post("/social-login", socialLogin);

router.post("/phone/request-otp", requestPhoneOtp);

router.post("/phone/verify-otp", verifyPhoneOtp);

router.post("/forgot-password", forgotPassword);

router.post("/verify-reset-code", verifyResetCode);

router.post("/reset-password", resetPassword);

router.get("/me", auth, async (req, res) => {
  res.json({
    userId: req.user.id
  });
});

module.exports = router;
