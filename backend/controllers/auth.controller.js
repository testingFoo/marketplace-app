const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email });

    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      ...req.body,
      password: hashed
    });

    res.json(user);

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "no user" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "wrong password" });

    const token = jwt.sign(
      { id: user._id, roles: user.roles },
      "SECRET",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        roles: user.roles
      }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// ================= ME =================
exports.me = async (req, res) => {
  res.json({ user: req.user });
};
