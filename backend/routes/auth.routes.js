const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ================= REGISTER =================
router.post("/register", ctrl.register);

// ================= LOGIN =================
router.post("/login", ctrl.login);

// ================= ME =================
router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;

  if (!auth) return res.json({ user: null });

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, "SECRET");

    const user = await User.findById(decoded.id);

    res.json({ user });

  } catch (e) {
    res.json({ user: null });
  }
});

module.exports = router;
