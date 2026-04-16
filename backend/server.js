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
// ENV
// =====================
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// =====================
// DB
// =====================
mongoose.connect(MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => console.log("🔴 MongoDB Error:", err));

// =====================
// DRIVER STATE
// =====================
let onlineDrivers = {};
let driverLocations = {};

// =====================
// SOCKET
// =====================
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("driver:online", (driverId) => {
    onlineDrivers[driverId] = {
      socketId: socket.id,
      busy: false
    };

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

    io.emit("driver:move", {
      driverId,
      lat,
      lng
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// =====================
// RIDE MODEL
// =====================
const rideSchema = new mongoose.Schema({
  userId: String,
  driverId: String,
  pickup: String,
  destination: String,
  status: { type: String, default: "REQUESTED" },
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
// CREATE RIDE (AUTO ASSIGN)
// =====================
app.post("/api/ride", async (req, res) => {
  const { pickup, destination, userId } = req.body;

  let driverId = null;
  let status = "REQUESTED";

  const availableDriver = Object.keys(onlineDrivers)[0];

  if (availableDriver) {
    driverId = availableDriver;
    status = "ACCEPTED";
    onlineDrivers[availableDriver].busy = true;
  }

  const ride = await Ride.create({
    pickup,
    destination,
    userId,
    driverId,
    status
  });

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
// UPDATE STATUS
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  const { status } = req.body;

  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "Not found" });

  ride.status = status;

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
server.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
