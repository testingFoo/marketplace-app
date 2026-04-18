const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);

  const user = await User.create({
    ...req.body,
    password: hashed
  });

  res.json(user);
};

exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) return res.status(404).json("no user");

  const ok = await bcrypt.compare(req.body.password, user.password);

  if (!ok) return res.status(401).json("wrong");

  const token = jwt.sign({ id: user._id }, "SECRET");

  res.json({ token, user });
};
