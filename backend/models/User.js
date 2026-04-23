const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  
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
  education: {
    type: String},
  currentCity: String,
  bornCity: String,
  profilePic: String,
  
  // ================= LOCATION =================
  city: String,
  country: String,

   // ================= PROFESSIONAL =================
  profession: String,
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
    ]
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

  // ================= ASSETS / COMMODITIES =================
  commodities: [
    {
      type: {
        type: String,
        enum: ["grain", "metal", "other"]
      },
      name: String,   // e.g. Wheat, Gold
      quantity: Number
    }
  ],

// ================= WALLET =================
  walletBalance: { type: Number, default: 10 },
  currency: { type: String, default: "USD" },

   roles: {
    driver: { type: Boolean, default: false },
   },

  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);
