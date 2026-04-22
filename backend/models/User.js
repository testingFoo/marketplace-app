const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  name: String,

  roles: {
    driver: { type: Boolean, default: false },
    business: { type: Boolean, default: false }
  },

  walletBalance: { type: Number, default: 0 },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);
