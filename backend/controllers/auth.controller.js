const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password
    } = req.body;

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,

      interests: [],
      connections: [],
      sentRequests: [],
      receivedRequests: []
    });

    const token = jwt.sign(
      { id: user._id },
      "SECRET",
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Register failed" });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      "SECRET",
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Login failed" });
  }
};
