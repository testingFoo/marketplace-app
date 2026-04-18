const router = require("express").Router();
const controller = require("../controllers/ride.controller");

router.post("/", controller.createRide);
router.patch("/:id/status", controller.updateStatus);

module.exports = router;
