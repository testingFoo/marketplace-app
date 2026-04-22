const express = require("express");
const router = express.Router();
const driverCtrl = require("../controllers/driverActions.controller");
const ctrl = require("../controllers/ride.controller");

// BASIC FLOW ONLY (SAFE)
router.get("/", ctrl.getRides);
router.post("/", ctrl.createRide);
router.patch("/:id/accept", ctrl.acceptRide);
router.patch("/:id/start-to-pickup", driverCtrl.startToPickup);
router.patch("/:id/arrived", driverCtrl.arrivedAtPickup);
router.patch("/:id/start-trip", driverCtrl.startTrip);

module.exports = router;
