const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,

      // 👤 identity
      firstName,
      surname,
      sex,
      dob,

      // 🌍 location
      city,
      country,

      // 📞 contact
      phone,

      // 💼 professional
      profession,
      industry,

      // 🏢 business
      isBusinessOwner,
      businessName,
      website,
      businessEmail,

      // 💰 preferences
      currency,

      // 🌾 assets
      commodities
    } = req.body;

    // 🔒 EXISTING EMAIL CHECK (UNCHANGED)
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // 🔒 HASH PASSWORD
    const hashed = await bcrypt.hash(password, 10);

    // ✅ SAFE USER CREATE (NO ...req.body)
    const user = await User.create({
      email,
      password: hashed,

      // 👤 BASIC
      name: `${firstName || ""} ${surname || ""}`.trim(),
      dob: dob || null,
      sex: sex || null,

      // 🌍 LOCATION
      currentCity: city || "",
      country: country || "",

      // 📞 CONTACT
      phone: phone || "",

      // 💼 PROFESSIONAL
      profession: profession || "",
      industry: industry || "",

      // 🏢 ROLES (SAFE STRUCTURE)
      roles: {
        driver: false,
        business: {
          isBusinessOwner: isBusinessOwner || false,
          name: businessName || "",
          website: website || "",
          email: businessEmail || ""
        }
      },

      // 💰 WALLET
      walletBalance: 10,
      currency: currency || "USD",

      // 🌾 COMMODITIES
      commodities: Array.isArray(commodities) ? commodities : []
    });

    // 🔐 TOKEN (ADDED — previously missing in register)
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
