const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/ride.controller");

router.get("/", ctrl.getRides);
router.post("/", ctrl.createRide);

router.patch("/:id/accept", ctrl.acceptRide);
router.patch("/:id/arrived", ctrl.driverArrived);
router.patch("/:id/start", ctrl.startTrip);
router.patch("/:id/complete", ctrl.completeRide);

module.exports = router;
