const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { createPublicKey } = require("crypto");
const axios = require("axios");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const { sendPasswordResetCode } = require("../services/mail.service");
const { sendWhatsAppOtp } = require("../services/whatsapp.service");

/*
- signup: creates user + wallet (NO token)
- login: returns JWT token
*/

const generateWalletCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "EJF-";
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const hashResetCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  username: user.username,
  phoneNumber: user.phoneNumber,
  membershipType: user.membershipType,
  authProvider: user.authProvider
});

const signToken = (user, rememberMe = false) =>
  jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? "30d" : "2h" }
  );

const ensureWallet = async (userId) => {
  const existingWallet = await Wallet.findOne({ userId });
  if (existingWallet) return existingWallet;

  return Wallet.create({
    userId,
    balance: 0,
    balances: {
      EUR: 0,
      USD: 0,
      GBP: 0,
      NGN: 0,
      GHS: 0,
      KES: 0
    },
    code: generateWalletCode()
  });
};

const generateUsername = async (email) => {
  const base = String(email).split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase() || "aurix_user";
  let username = base;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${base}_${counter}`;
    counter += 1;
  }

  return username;
};

const verifyGoogleAccessToken = async (accessToken) => {
  const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!data?.email || data.email_verified === false) {
    throw new Error("Google email is not verified");
  }

  return {
    socialId: data.sub,
    email: data.email,
    firstName: data.given_name || "Google",
    lastName: data.family_name || "User"
  };
};

const verifyAppleIdToken = async (idToken) => {
  const decodedHeader = jwt.decode(idToken, { complete: true })?.header;
  if (!decodedHeader?.kid) {
    throw new Error("Invalid Apple token");
  }

  const { data } = await axios.get("https://appleid.apple.com/auth/keys");
  const jwk = data.keys.find((key) => key.kid === decodedHeader.kid);
  if (!jwk) {
    throw new Error("Apple signing key not found");
  }

  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ["RS256"],
    issuer: "https://appleid.apple.com",
    audience: process.env.APPLE_CLIENT_ID
  });

  if (!payload?.email) {
    throw new Error("Apple email is missing");
  }

  return {
    socialId: payload.sub,
    email: payload.email,
    firstName: "Apple",
    lastName: "User"
  };
};

const findOrCreateSocialUser = async ({ provider, profile }) => {
  const normalizedEmail = profile.email.toLowerCase().trim();

  let user = await User.findOne({ email: normalizedEmail });
  if (user) {
    if (!user.authProvider || user.authProvider === "local") {
      user.authProvider = provider;
      user.socialId = profile.socialId;
      await user.save();
    }
    await ensureWallet(user._id);
    return user;
  }

  user = await User.create({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: normalizedEmail,
    username: await generateUsername(normalizedEmail),
    authProvider: provider,
    socialId: profile.socialId,
    membershipType: 1
  });

  await ensureWallet(user._id);
  return user;
};

/* =========================
   SIGNUP
========================= */
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      username,
      phoneNumber,
      membershipType
    } = req.body;

    if (!firstName || !lastName || !email || !password || !username || !phoneNumber) {
      return res.status(400).json({
        message: "firstName, lastName, email, password, username and phoneNumber are required"
      });
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.trim().replace(/\s+/g, "_");
    const normalizedPhone = phoneNumber.trim();

    // check email exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // check username exists
    const existingUsername = await User.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // check phone exists
    const existingPhone = await User.findOne({ phoneNumber: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({ message: "Phone number already exists" });
    }

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      phoneNumber: normalizedPhone,
      membershipType: Number(membershipType) || 1,
      passwordHash
    });

    // create wallet
    await Wallet.create({
      userId: user._id,
      balance: 0,
      balances: {
        EUR: 0,
        USD: 0,
        GBP: 0,
        NGN: 0,
        GHS: 0,
        KES: 0
      },
      code: generateWalletCode()
    });

    return res.status(201).json({
      message: "User created successfully",
      user: publicUser(user)
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

/* =========================
   LOGIN
========================= */
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "email and password are required"
      });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user, Boolean(rememberMe));

    return res.json({
      token,
      user: publicUser(user),
      rememberMe: Boolean(rememberMe)
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

/* =========================
   SOCIAL LOGIN
========================= */
exports.socialLogin = async (req, res) => {
  try {
    const { provider, accessToken, idToken, rememberMe } = req.body;

    if (!["google", "apple"].includes(provider)) {
      return res.status(400).json({ message: "provider must be google or apple" });
    }

    let profile;
    if (provider === "google") {
      if (!accessToken) {
        return res.status(400).json({ message: "Google accessToken is required" });
      }
      profile = await verifyGoogleAccessToken(accessToken);
    }

    if (provider === "apple") {
      if (!idToken) {
        return res.status(400).json({ message: "Apple idToken is required" });
      }
      if (!process.env.APPLE_CLIENT_ID) {
        return res.status(500).json({ message: "APPLE_CLIENT_ID is not configured" });
      }
      profile = await verifyAppleIdToken(idToken);
    }

    const user = await findOrCreateSocialUser({ provider, profile });
    const token = signToken(user, Boolean(rememberMe));

    return res.json({
      token,
      user: publicUser(user),
      rememberMe: Boolean(rememberMe)
    });
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      message: err.message || "Social login failed"
    });
  }
};

/* =========================
   PHONE LOGIN
========================= */
exports.requestPhoneOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "phoneNumber is required" });
    }

    const normalizedPhone = String(phoneNumber).trim();
    const user = await User.findOne({ phoneNumber: normalizedPhone });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    user.phoneLoginCodeHash = hashResetCode(code);
    user.phoneLoginCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendWhatsAppOtp({
      to: normalizedPhone,
      code
    });

    return res.json({
      message: "Login code sent"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyPhoneOtp = async (req, res) => {
  try {
    const { phoneNumber, code, rememberMe } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ message: "phoneNumber and code are required" });
    }

    const user = await User.findOne({
      phoneNumber: String(phoneNumber).trim(),
      phoneLoginCodeHash: hashResetCode(String(code).trim()),
      phoneLoginCodeExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired login code" });
    }

    user.phoneLoginCodeHash = undefined;
    user.phoneLoginCodeExpiresAt = undefined;
    await user.save();

    const token = signToken(user, Boolean(rememberMe));

    return res.json({
      token,
      user: publicUser(user),
      rememberMe: Boolean(rememberMe)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    user.passwordResetCodeHash = hashResetCode(code);
    user.passwordResetCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetCode({
      to: user.email,
      code
    });

    return res.json({
      message: "Password reset code sent"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "email and code are required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      passwordResetCodeHash: hashResetCode(String(code).trim()),
      passwordResetCodeExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    return res.json({ message: "Reset code verified" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ message: "email, code and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      passwordResetCodeHash: hashResetCode(String(code).trim()),
      passwordResetCodeExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.passwordResetCodeHash = undefined;
    user.passwordResetCodeExpiresAt = undefined;
    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
