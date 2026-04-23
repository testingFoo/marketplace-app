const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  // ================= AUTH =================
  email: { type: String, unique: true },
  password: String,

  // ================= BASIC PROFILE =================
  firstName: String,
  lastName: String,
  sex: { type: String, enum: ["male", "female", "other"] },
  dob: Date,

  phone: {
    countryCode: String,
    number: String
  },

  education: String,

  profilePic: String,

  // ================= LOCATION =================
  city: String,
  country: String,
  currentCity: String,
  bornCity: String,

  // ================= PROFESSIONAL =================
  profession: String,

  // 🔥 SAFE ENUM (won’t crash if invalid)
  industry: {
    type: String,
    enum: [
      "Technology",
      "Finance",
      "Healthcare",
      "Education",
      "Construction",
      "Transport",
      "Retail",
      "Manufacturing",
      "Agriculture",
      "Media",
      "Legal",
      "Other"
    ],
    default: "Other"
  },

  // ================= BUSINESS =================
  business: {
    isOwner: { type: Boolean, default: false },
    name: String,
    website: String,
    email: String,
    social: {
      instagram: String,
      linkedin: String,
      youtube: String
    }
  },

  // ================= ASSETS =================
  commodities: [
    {
      type: {
        type: String,
        enum: ["grain", "metal", "other"],
        default: "other"
      },
      name: String,
      quantity: Number
    }
  ],

  // ================= WALLET =================
  walletBalance: { type: Number, default: 10 },
  currency: { type: String, default: "USD" },

  // ================= ROLES =================
  roles: {
    driver: { type: Boolean, default: false }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("User", UserSchema);
