const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");

/*
- added username field to user model and signup/login flow
- add wallet code generation during signup
*/
exports.signup = async (req, res) => {
<<<<<<< HEAD

    try {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: "email and password are required" });
 const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email:normalizedEmail });
=======
  const { email, password, username } = req.body;

  if (!email || !password || !username) return res.status(400).json({ message: "All fields are required" });

  const existing = await User.findOne({ email });
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a
  if (existing) return res.status(409).json({ message: "Email already exists" });

  const existingUsername = await User.findOne({ username });
  if (existingUsername) return res.status(409).json({ message: "Username already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
<<<<<<< HEAD
  const user = await User.create({ email:normalizedEmail, passwordHash });
=======
  const user = await User.create({ email, passwordHash, username });
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a

  await Wallet.create({ userId: user._id, balance: 0, code: generateWalletCode() });
  const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

<<<<<<< HEAD
  return res.status(201).json({ message: "User created" });

  } 
  catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Internal server error"
    });
  }

=======
  return res.status(201).json({ message: "User created", token });
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a
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
  try{
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email and password are required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

<<<<<<< HEAD
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
=======
  const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return res.json({ token });
>>>>>>> 71dec04ce28dfd506e44e03d2c105fa068a8900a
};