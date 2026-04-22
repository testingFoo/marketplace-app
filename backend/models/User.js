const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,

  name: String,

  // 🔥 SUPER APP FIELDS
  walletBalance: { type: Number, default: 0 },

  roles: {
    driver: { type: Boolean, default: false },
    business: { type: Boolean, default: false }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);
