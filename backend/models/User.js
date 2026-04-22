const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  name: String,
  dob: Date,
  sex: { type: String, enum: ["male", "female", "other"] },
education: {
    type: String},
  currentCity: String,
  bornCity: String,
  profilePic: String,
  roles: {
    driver: { type: Boolean, default: false },
   business: {
    isBusinessOwner: { type: Boolean, default: false },
    name: String,
    website: String,
    email: String
  },
  },

  walletBalance: { type: Number, default: 10 },
  currency: { type: String, default: "USD" },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);
