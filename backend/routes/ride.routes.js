const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/ride.controller");
const driverCtrl = require("../controllers/driverActions.controller");

console.log("driverCtrl:", driverCtrl);

// BASIC
router.get("/", ctrl.getRides);
router.post("/", ctrl.createRide);

// ACCEPT
router.patch("/:id/accept", ctrl.acceptRide);

// 🔥 NEW DRIVER FLOW ONLY
router.patch("/:id/start-to-pickup", driverCtrl.startToPickup);
router.patch("/:id/arrived", driverCtrl.arrived);
router.patch("/:id/start-trip", driverCtrl.startTrip);

module.exports = router;
