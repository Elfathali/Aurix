const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const walletRoutes = require("./routes/wallet.routes");
const txRoutes = require("./routes/transaction.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ ok: true, service: "aurix" }));
console.log("authRoutes type:", typeof authRoutes);
console.log("walletRoutes type:", typeof walletRoutes);
console.log("txRoutes type:", typeof txRoutes);

app.use("/auth", authRoutes);
app.use("/wallet", walletRoutes);
app.use("/tx", txRoutes);

module.exports = app;