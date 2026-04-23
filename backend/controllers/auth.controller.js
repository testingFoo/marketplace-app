const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,

      firstName,
      surname,
      sex,
      dob,

      city,
      country,

      phone,

      profession,
      industry,

      isBusinessOwner,
      businessName,
      website,
      businessEmail,

      currency,
      commodities
    } = req.body;

    // 🔒 EMAIL CHECK (KEEP)
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // 🔒 HASH
    const hashed = await bcrypt.hash(password, 10);

    // ✅ CREATE USER MATCHING YOUR SCHEMA
    const user = await User.create({
      email,
      password: hashed,

      // BASIC
      firstName: firstName || "",
      lastName: surname || "",
      sex: sex || null,
      dob: dob || null,

      // LOCATION
      city: city || "",
      country: country || "",

      // CONTACT
      phone: {
        countryCode: "",
        number: phone || ""
      },

      // PROFESSIONAL
      profession: profession || "",
      industry: industry || "Other",

      // ✅ FIXED BUSINESS (correct schema)
      business: {
        isOwner: isBusinessOwner || false,
        name: businessName || "",
        website: website || "",
        email: businessEmail || ""
      },

      // WALLET
      walletBalance: 10,
      currency: currency || "USD",

      // COMMODITIES
      commodities: Array.isArray(commodities) ? commodities : []
    });

    // 🔐 TOKEN
    const token = jwt.sign(
      { id: user._id },
      "SECRET",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (err) {
    console.log("REGISTER ERROR FULL:", err);
    res.status(500).json({
      error: "Server error",
      message: err.message   // 🔥 IMPORTANT FOR DEBUG
    });
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
