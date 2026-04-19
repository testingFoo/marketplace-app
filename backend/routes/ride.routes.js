const express = require("express");
const router = express.Router();

const {
  createRide,
  acceptRide,
  updateStatus,
  getRides
} = require("../controllers/ride.controller");

// ✅ THIS FIXES YOUR 404
router.get("/", getRides);

router.post("/", createRide);
router.patch("/:id/accept", acceptRide);
router.patch("/:id/status", updateStatus);

module.exports = router;
