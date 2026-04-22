const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const auth = require("../middleware/auth.middleware");

// REGISTER
router.post("/register", ctrl.register);

// LOGIN
router.post("/login", ctrl.login);

// CURRENT USER
router.get("/me", (req, res) => {
  const auth = req.headers.authorization;

  if (!auth) return res.json({ user: null });

  try {
    const jwt = require("jsonwebtoken");
    const token = auth.split(" ")[1];

    const decoded = jwt.verify(token, "SECRET");

    const User = require("../models/User");

    User.findById(decoded.id).then(user => {
      res.json({ user });
    });

  } catch (e) {
    res.json({ user: null });
  }
});

module.exports = router;
