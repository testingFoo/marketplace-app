const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // ================= BASIC =================
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,

  // ================= PROFILE =================
  sex: String,
  dob: Date,
  profileImage: String, // URL from multer/cloud storage

  // ================= GEO =================
  bornCity: String,
  currentCity: String,
  country: String,

  // ================= BUSINESS =================
  hasBusiness: { type: Boolean, default: false },
  businessName: String,

  // ================= INTERESTS =================
  interests: {
    type: [String],
    default: []
  },

  // ================= SOCIAL GRAPH =================
  connections: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],

  sentRequests: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],

  receivedRequests: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);
