const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// =====================
// Middleware
// =====================
app.use(express.json());

app.use(cors({
  origin: "https://marketplace-app-kohl.vercel.app"
}));

// =====================
// ENV
// =====================
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// =====================
// DEBUG
// =====================
console.log("🧠 Server booting...");
console.log("MONGO_URI exists?", !!MONGO_URI);

// =====================
// MongoDB
// =====================
mongoose.connect(MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => {
    console.log("🔴 MongoDB Error:");
    console.log(err);
  });

// =====================
// TRIP STATE MACHINE
// =====================
const RIDE_STATES = {
  REQUESTED: "REQUESTED",
  ACCEPTED: "ACCEPTED",
  ARRIVING: "ARRIVING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED"
};

// =====================
// Schema
// =====================
const rideSchema = new mongoose.Schema({
  userId: String,
  driverId: String,

  pickup: String,
  destination: String,

  status: {
    type: String,
    default: RIDE_STATES.REQUESTED
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Ride = mongoose.model("Ride", rideSchema);

// =====================
// HEALTH CHECK
// =====================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// =====================
// CREATE RIDE
// =====================
app.post("/api/ride", async (req, res) => {
  try {
    const { pickup, destination, userId } = req.body;

    console.log("📥 New ride:", req.body);

    if (!pickup || !destination || !userId) {
      return res.status(400).json({ error: "missing fields" });
    }

    const ride = await Ride.create({
      pickup,
      destination,
      userId,
      status: RIDE_STATES.REQUESTED
    });

    res.json(ride);

  } catch (err) {
    console.log("❌ Create error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// =====================
// GET RIDES
// =====================
app.get("/api/rides", async (req, res) => {
  const rides = await Ride.find().sort({ createdAt: -1 });
  res.json(rides);
});

// =====================
// DRIVER ACTIVE CHECK (ONE RIDE ONLY)
// =====================
async function driverHasActiveRide(driverId) {
  const active = await Ride.findOne({
    driverId,
    status: { $in: ["ACCEPTED", "ARRIVING", "IN_PROGRESS"] }
  });

  return !!active;
}

// =====================
// STATE MACHINE RULES
// =====================
const validTransitions = {
  REQUESTED: ["ACCEPTED"],
  ACCEPTED: ["ARRIVING"],
  ARRIVING: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: []
};

// =====================
// UPDATE RIDE STATUS (CORE ENGINE)
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  try {
    const { status, driverId } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    const current = ride.status;

    console.log(`📌 Transition: ${current} → ${status}`);

    // =====================
    // VALID STATE CHECK
    // =====================
    if (!validTransitions[current].includes(status)) {
      return res.status(400).json({
        error: `Invalid transition: ${current} → ${status}`
      });
    }

    // =====================
    // DRIVER ACCEPT RULE
    // =====================
    if (status === "ACCEPTED") {
      if (ride.status !== "REQUESTED") {
        return res.status(400).json({ error: "Already taken" });
      }

      if (await driverHasActiveRide(driverId)) {
        return res.status(400).json({ error: "Driver already on trip" });
      }

      ride.driverId = driverId;
    }

    // =====================
    // STATUS UPDATE
    // =====================
    ride.status = status;

    await ride.save();

    res.json(ride);

  } catch (err) {
    console.log("❌ Update error:", err);
    res.status(500).json({ error: "server error" });
  }
});

// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
