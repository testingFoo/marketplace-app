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
// MongoDB Connection
// =====================
mongoose.connect(MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch((err) => {
    console.log("🔴 MongoDB Connection Error:");
    console.log(err);
  });

// =====================
// Schema (STEP 3 UPDATED)
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

// =====================
// Create Ride (STEP 3)
// =====================
app.post("/api/ride", async (req, res) => {
  try {
    const { pickup, destination, userId } = req.body;

    console.log("📥 Create Ride Request:", req.body);

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
    console.log("❌ Create Ride Error:");
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// Get All Rides
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
// Update Status (Driver)
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    console.log("📌 Status Update:", req.params.id, status);

    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json(ride);

  } catch (err) {
    console.log("❌ Status Update Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// Start Server
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
