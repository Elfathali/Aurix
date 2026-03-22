const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");

/*
- added username field to user model and signup/login flow
- add wallet code generation during signup
*/
exports.signup = async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) return res.status(400).json({ message: "All fields are required" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: "Email already exists" });

  const existingUsername = await User.findOne({ username });
  if (existingUsername) return res.status(409).json({ message: "Username already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, username });

  await Wallet.create({ userId: user._id, balance: 0, code: generateWalletCode() });
  const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

  return res.status(201).json({ message: "User created", token });
};
generateWalletCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "EJF-";
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token });
};