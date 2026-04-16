const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);

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
// STATE
// =====================
let onlineDrivers = {};
let driverLocations = {};

// =====================
// ROUTE API
// =====================
async function getRoute(p1, p2, d1, d2) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${p2},${p1};${d2},${d1}?overview=full&geometries=geojson`;

    const res = await axios.get(url);
    const route = res.data.routes[0];

    if (!route) return null;

    return {
      coords: route.geometry.coordinates,
      distance: route.distance,
      duration: route.duration
    };
  } catch (e) {
    console.log("Route error", e.message);
    return null;
  }
}

// =====================
// SOCKET
// =====================
io.on("connection", (socket) => {

  socket.on("driver:online", (driverId) => {
    onlineDrivers[driverId] = { socketId: socket.id, busy: false };
  });

  socket.on("driver:offline", (driverId) => {
    delete onlineDrivers[driverId];
    delete driverLocations[driverId];
  });

  socket.on("driver:location", ({ driverId, lat, lng }) => {
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
// CREATE RIDE (STEP H FIXED)
// =====================
app.post("/api/ride", async (req, res) => {
  const { pickup, destination, userId } = req.body;

  const ride = await Ride.create({
    pickup,
    destination,
    userId,
    status: "REQUESTED",
    driverId: null
  });

  const route = await getRoute(52.2297, 21.0122, 52.24, 21.02);

  io.emit("ride:new", { ride, route });

  res.json({ ride, route });
});

// =====================
// DRIVER ACCEPT RIDE
// =====================
app.patch("/api/ride/:id/accept", async (req, res) => {
  const { driverId } = req.body;

  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "Not found" });

  if (ride.status !== "REQUESTED") {
    return res.status(400).json({ error: "Already taken" });
  }

  ride.driverId = driverId;
  ride.status = "ACCEPTED";

  await ride.save();

  io.emit("ride:update", ride);

  res.json(ride);
});

// =====================
// STATUS FLOW
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  const { status } = req.body;

  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "Not found" });

  ride.status = status;

  if (status === "COMPLETED" && onlineDrivers[ride.driverId]) {
    onlineDrivers[ride.driverId].busy = false;
  }

  await ride.save();

  io.emit("ride:update", ride);

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
server.listen(3000, () => {
  console.log("🚀 Step H backend running");
});
