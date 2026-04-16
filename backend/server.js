const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// =====================
// SOCKET
// =====================
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PATCH"] }
});

app.use(express.json());
app.use(cors());

// =====================
// DB
// =====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => console.log("🔴 Mongo Error", err));

// =====================
// DRIVER STATE
// =====================
let onlineDrivers = {};
let driverLocations = {};

// =====================
// SOCKET EVENTS
// =====================
io.on("connection", (socket) => {

  socket.on("driver:online", (driverId) => {
    onlineDrivers[driverId] = { socketId: socket.id, busy: false };
    console.log("🟢 Driver online:", driverId);
  });

  socket.on("driver:offline", (driverId) => {
    delete onlineDrivers[driverId];
    delete driverLocations[driverId];
    console.log("🔴 Driver offline:", driverId);
  });

  socket.on("driver:location", (data) => {
    const { driverId, lat, lng } = data;

    driverLocations[driverId] = { lat, lng };

    io.emit("driver:move", { driverId, lat, lng });
  });
});

// =====================
// MODEL
// =====================
const rideSchema = new mongoose.Schema({
  userId: String,
  driverId: String,
  pickup: String,
  destination: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
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
// CREATE RIDE (SMART DISPATCH)
// =====================
app.post("/api/ride", async (req, res) => {
  const { pickup, destination, userId } = req.body;

  const availableDriverId = Object.keys(onlineDrivers).find(
    d => !onlineDrivers[d].busy
  );

  let ride;

  if (availableDriverId) {
    onlineDrivers[availableDriverId].busy = true;

    ride = await Ride.create({
      pickup,
      destination,
      userId,
      driverId: availableDriverId,
      status: "ACCEPTED"
    });

    io.emit("ride:new", ride);

  } else {
    ride = await Ride.create({
      pickup,
      destination,
      userId,
      driverId: null,
      status: "NO_DRIVER_AVAILABLE"
    });

    io.emit("ride:new", ride);
  }

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
// STATUS UPDATE (SAFE)
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  const { status } = req.body;

  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "Not found" });

  // 🚨 BLOCK updates if no driver
  if (ride.status === "NO_DRIVER_AVAILABLE") {
    return res.status(400).json({ error: "No driver assigned" });
  }

  ride.status = status;

  // free driver when finished
  if (status === "COMPLETED" && ride.driverId) {
    if (onlineDrivers[ride.driverId]) {
      onlineDrivers[ride.driverId].busy = false;
    }
  }

  await ride.save();

  io.emit("ride:update", ride);

  res.json(ride);
});

// =====================
// START
// =====================
server.listen(3000, () => {
  console.log("🚀 Server running");
});
