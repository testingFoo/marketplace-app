
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json("no token");

  try {
    const decoded = jwt.verify(token.split(" ")[1], "SECRET");
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json("invalid token");
  }
};
