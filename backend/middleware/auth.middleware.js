const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ error: "no token" });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, "SECRET");

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "user not found" });
    }

    req.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      currentCity: user.currentCity,
      country: user.country,
      hasBusiness: user.hasBusiness || false
    };

    req.userFull = user;

    next();

  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
};
