const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// =====================
// SOCKET.IO SETUP
// =====================
const io = new Server(server, {
  cors: {
    origin: "https://marketplace-app-kohl.vercel.app",
    methods: ["GET", "POST", "PATCH"]
  }
});

// =====================
// MIDDLEWARE
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
// DB CONNECT
// =====================
mongoose.connect(MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => {
    console.log("🔴 MongoDB Error:");
    console.log(err);
  });

// =====================
// SOCKET CONNECTION
// =====================
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
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
// CREATE RIDE
// =====================
app.post("/api/ride", async (req, res) => {
  const { pickup, destination, userId } = req.body;

  const ride = await Ride.create({
    pickup,
    destination,
    userId
  });

  // 🔥 REAL-TIME EVENT
  io.emit("ride:new", ride);

  res.json(ride);
});

// =====================
// GET RIDES
// =====================
app.get("/api/rides", async (req, res) => {
  const rides = await Ride.find().sort({ createdAt: -1 });
  res.json(rides);
});

// =====================
// DRIVER LIMIT CHECK
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
// UPDATE STATUS (REAL-TIME)
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  const { status, driverId } = req.body;

  const ride = await Ride.findById(req.params.id);

  if (!ride) return res.status(404).json({ error: "Ride not found" });

  const current = ride.status;

  if (!validTransitions[current].includes(status)) {
    return res.status(400).json({ error: "Invalid transition" });
  }

  if (status === "ACCEPTED") {
    if (await driverHasActiveRide(driverId)) {
      return res.status(400).json({ error: "Driver already on trip" });
    }

    ride.driverId = driverId;
  }

  ride.status = status;

  await ride.save();

  // 🔥 REAL-TIME UPDATE EVENT
  io.emit("ride:update", ride);

  res.json(ride);
});

// =====================
// START SERVER (IMPORTANT CHANGE)
// =====================
server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
