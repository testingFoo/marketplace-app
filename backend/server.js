const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// =====================
// Middleware
// =====================
app.use(express.json());

// CORS (your Vercel frontend)
app.use(cors({
  origin: "https://marketplace-app-kohl.vercel.app"
}));

// =====================
// ENV
// =====================
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// =====================
// DEBUG (safe)
// =====================
console.log("🧠 Server starting...");
console.log("MONGO_URI exists?", !!MONGO_URI);

// =====================
// MongoDB Connection
// =====================
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("🟢 MongoDB Connected");
  })
  .catch((err) => {
    console.log("🔴 MongoDB Connection Error:");
    console.log(err);
  });

// =====================
// Ride Schema
// =====================
const rideSchema = new mongoose.Schema({
  userId: String,
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
// Routes
// =====================

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Root
app.get("/", (req, res) => {
  res.send("🚀 Uber Clone Backend Running");
});

// Create ride
app.post("/api/ride", async (req, res) => {
  try {
    const { pickup, destination } = req.body;

    if (!pickup || !destination) {
      return res.status(400).json({
        error: "pickup and destination are required"
      });
    }

    const ride = await Ride.create({
      pickup,
      destination
    });

    res.json(ride);
  } catch (err) {
    console.log("❌ Create Ride Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all rides
app.get("/api/rides", async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.log("❌ Get Rides Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update ride status
app.patch("/api/ride/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(ride);
  } catch (err) {
    console.log("❌ Update Status Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// Start server
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
