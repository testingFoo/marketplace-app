const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/ride.controller");

// BASIC FLOW ONLY (SAFE)
router.get("/", ctrl.getRides);
router.post("/", ctrl.createRide);
router.patch("/:id/accept", ctrl.acceptRide);

module.exports = router;
