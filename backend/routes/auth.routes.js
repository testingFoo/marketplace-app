const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const bcrypt = require("bcrypt");
const passport = require("passport");

const User = require("../models/User");
const Wallet = require("../models/Wallet");

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed,
      name
    });

    // 🔥 auto create wallet
    await Wallet.create({
      userId: user._id
    });

    res.json({ user });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ error: "Register failed" });
  }
});

// ================= LOGIN =================
router.post("/login",
  passport.authenticate("local"),
  (req, res) => {
    res.json({ user: req.user });
  }
);

// ================= LOGOUT =================
router.post("/logout", (req, res) => {
  req.logout(() => {
    res.json({ ok: true });
  });
});

// ================= CURRENT USER =================
router.get("/me", (req, res) => {
  res.json({ user: req.user || null });
});

module.exports = router;

module.exports = router;
