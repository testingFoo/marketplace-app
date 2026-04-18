const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  role: { type: String, enum: ["rider", "driver"], required: true },
  email: String,
  password: String,
  name: String
});

module.exports = mongoose.model("User", UserSchema);
