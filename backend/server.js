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
console.log("🧠 Server starting...");
console.log("MONGO_URI exists?", !!MONGO_URI);

// =====================
// MongoDB
// =====================
mongoose.connect(MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => {
    console.log("🔴 MongoDB Connection Error:");
    console.log(err);
  });

// =====================
// Schema (STEP 4)
// =====================
const rideSchema = new mongoose.Schema({
  userId: String,
  driverId: String,
  pickup: String,
  destination: String,
  status: {
    type: String,
    default: "REQUESTED"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Ride = mongoose.model("Ride", rideSchema);

// =====================
// Health Check
// =====================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// =====================
// Root
// =====================
app.get("/", (req, res) => {
  res.send("🚀 Uber Clone Backend Running");
});

// =====================
// Create Ride (NO CHANGES except driverId optional)
// =====================
app.post("/api/ride", async (req, res) => {
  try {
    const { pickup, destination, userId } = req.body;

    console.log("📥 Ride create:", req.body);

    if (!pickup || !destination || !userId) {
      return res.status(400).json({
        error: "pickup, destination, userId required"
      });
    }

    const ride = await Ride.create({
      pickup,
      destination,
      userId
    });

    res.json(ride);

  } catch (err) {
    console.log("❌ Create Ride Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// Get Rides
// =====================
app.get("/api/rides", async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.log("❌ Get Rides Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// UPDATE STATUS (STEP 4 - LOCK SYSTEM)
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  try {
    const { status, driverId } = req.body;

    console.log("📌 Status Update:", req.params.id, status);

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    // 🚨 LOCK LOGIC (IMPORTANT)
    if (status === "ACCEPTED") {
      if (ride.status !== "REQUESTED") {
        return res.status(400).json({ error: "Already accepted" });
      }

      ride.status = "ACCEPTED";
      ride.driverId = driverId;
    } else {
      ride.status = status;
    }

    await ride.save();

    res.json(ride);

  } catch (err) {
    console.log("❌ Update Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
