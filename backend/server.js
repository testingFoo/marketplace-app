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
// ROUTE ENGINE
// =====================
async function getRoute(aLat, aLng, bLat, bLng) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${aLng},${aLat};${bLng},${bLat}?overview=full&geometries=geojson`;

    const res = await axios.get(url);
    const route = res.data.routes?.[0];

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
    console.log("🟢 Driver online", driverId);
  });

  socket.on("driver:offline", (driverId) => {
    delete onlineDrivers[driverId];
    delete driverLocations[driverId];
    console.log("🔴 Driver offline", driverId);
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
// CREATE RIDE (FIXED FLOW)
// =====================
app.post("/api/ride", async (req, res) => {
  const { pickup, destination, userId, pickupCoords, dropCoords } = req.body;

  let bestDriver = null;

  for (const id of Object.keys(onlineDrivers)) {
    if (!onlineDrivers[id].busy) {
      bestDriver = id;
      break;
    }
  }

  let ride;

  if (bestDriver) {
    onlineDrivers[bestDriver].busy = true;

    ride = await Ride.create({
      pickup,
      destination,
      userId,
      driverId: bestDriver,
      status: "ACCEPTED"
    });
  } else {
    ride = await Ride.create({
      pickup,
      destination,
      userId,
      driverId: null,
      status: "NO_DRIVER_AVAILABLE"
    });
  }

  const route = await getRoute(
    pickupCoords?.lat || 52.2297,
    pickupCoords?.lng || 21.0122,
    dropCoords?.lat || 52.23,
    dropCoords?.lng || 21.01
  );

  io.emit("ride:new", { ride, route });

  res.json({ ride, route });
});

// =====================
// GET RIDES
// =====================
app.get("/api/rides", async (req, res) => {
  res.json(await Ride.find().sort({ createdAt: -1 }));
});

// =====================
// STATUS UPDATE (FULL FIX)
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  const { status } = req.body;

  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "Not found" });

  if (ride.status === "NO_DRIVER_AVAILABLE") {
    return res.status(400).json({ error: "No driver" });
  }

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
server.listen(3000, () => {
  console.log("🚀 STEP H BACKEND READY");
});
