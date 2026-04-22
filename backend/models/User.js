// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,

  name: String,

  roles: {
    type: [String],
    default: ["USER"] // can add DRIVER, BUSINESS_OWNER later
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", UserSchema);
