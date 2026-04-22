const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const auth = require("../middleware/auth.middleware");

// REGISTER
router.post("/register", ctrl.register);

// LOGIN
router.post("/login", ctrl.login);

// CURRENT USER
router.get("/me", auth, ctrl.me);

module.exports = router;
