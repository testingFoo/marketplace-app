const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// =====================
// SOCKET.IO
// =====================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

// =====================
// MIDDLEWARE
// =====================
app.use(express.json());
app.use(cors());

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
// DB CONNECT
// =====================
mongoose.connect(MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => {
    console.log("🔴 MongoDB Error:");
    console.log(err);
  });

// =====================
// DRIVER MEMORY (🔥 NEW)
// =====================
let onlineDrivers = [];

// =====================
// SOCKET CONNECTION
// =====================
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("driver:online", (driverId) => {
    console.log("🟢 Driver online:", driverId);

    onlineDrivers.push({
      id: driverId,
      socketId: socket.id,
      busy: false
    });
  });

  socket.on("driver:offline", (driverId) => {
    console.log("🔴 Driver offline:", driverId);

    onlineDrivers = onlineDrivers.filter(d => d.id !== driverId);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);

    onlineDrivers = onlineDrivers.filter(d => d.socketId !== socket.id);
  });
});

// =====================
// STATE MACHINE
// =====================
const RIDE_STATES = {
  REQUESTED: "REQUESTED",
  ACCEPTED: "ACCEPTED",
  ARRIVING: "ARRIVING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED"
};

// =====================
// SCHEMA
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
// HEALTH
// =====================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// =====================
// CREATE RIDE (🔥 AUTO ASSIGN)
// =====================
app.post("/api/ride", async (req, res) => {
  try {
    const { pickup, destination, userId } = req.body;

    const availableDriver = onlineDrivers.find(d => !d.busy);

    let driverId = null;
    let status = "REQUESTED";

    if (availableDriver) {
      driverId = availableDriver.id;
      status = "ACCEPTED";
      availableDriver.busy = true;
    }

    const ride = await Ride.create({
      pickup,
      destination,
      userId,
      driverId,
      status
    });

    console.log("🚗 Ride created:", ride._id);

    io.emit("ride:new", ride);

    res.json(ride);

  } catch (err) {
    console.log("❌ Create error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// GET RIDES
// =====================
app.get("/api/rides", async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.log("❌ Get rides error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// UPDATE STATUS
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  try {
    const { status, driverId } = req.body;

    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ error: "Ride not found" });

    ride.status = status;

    // 🔥 FREE DRIVER WHEN DONE
    if (status === "COMPLETED") {
      const driver = onlineDrivers.find(d => d.id === ride.driverId);
      if (driver) driver.busy = false;
    }

    await ride.save();

    console.log(`🔄 Ride ${ride._id} → ${status}`);

    io.emit("ride:update", ride);

    res.json(ride);

  } catch (err) {
    console.log("❌ Update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// START SERVER
// =====================
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
