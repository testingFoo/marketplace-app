
const router = require("express").Router();
const ctrl = require("../controllers/driver.controller");
const auth = require("../middleware/auth.middleware");

router.get("/", auth, ctrl.getProfile);
router.post("/", auth, ctrl.upsertProfile);
router.patch("/toggle", auth, ctrl.toggleAvailability);

module.exports = router;
