const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");

exports.signup = async (req, res) => {

    try {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: "email and password are required" });
 const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email:normalizedEmail });
  if (existing) return res.status(409).json({ message: "Email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email:normalizedEmail, passwordHash });

  await Wallet.create({ userId: user._id, balance: 0 });

  return res.status(201).json({ message: "User created" });

  } 
  catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }

};

exports.login = async (req, res) => {
  try{
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

return res.json({
  token,
  user: {
    id: user._id,
    email: user.email
  }
});

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};