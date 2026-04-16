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
// DISTANCE
// =====================
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// =====================
// ROUTE API (OSRM)
// =====================
async function getRoute(pickupLat, pickupLng, dropLat, dropLng) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${pickupLng},${pickupLat};${dropLng},${dropLat}` +
      `?overview=full&geometries=geojson`;

    const res = await axios.get(url);

    const route = res.data.routes[0];

    if (!route) return null;

    return {
      coords: route.geometry.coordinates,
      distance: route.distance,
      duration: route.duration
    };
  } catch (err) {
    console.log("❌ Route error:", err.message);
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
// CREATE RIDE (STEP F UPGRADED)
// =====================
app.post("/api/ride", async (req, res) => {
  const { pickup, destination, userId } = req.body;

  const pickupLat = 52.2297;
  const pickupLng = 21.0122;

  const dropLat = 52.23 + Math.random() * 0.02;
  const dropLng = 21.01 + Math.random() * 0.02;

  // nearest driver
  let bestDriver = null;
  let bestDistance = Infinity;

  for (const id of Object.keys(onlineDrivers)) {
    const loc = driverLocations[id];
    if (!loc || onlineDrivers[id].busy) continue;

    const dist = getDistance(pickupLat, pickupLng, loc.lat, loc.lng);

    if (dist < bestDistance) {
      bestDistance = dist;
      bestDriver = id;
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

  // route (even if no driver → still show map path)
  const route = await getRoute(
    pickupLat,
    pickupLng,
    dropLat,
    dropLng
  );

  io.emit("ride:new", { ride, route });

  res.json({ ride, route });
});

// =====================
// GET RIDES
// =====================
app.get("/api/rides", async (req, res) => {
  const rides = await Ride.find().sort({ createdAt: -1 });
  res.json(rides);
});

// =====================
// STATUS UPDATE
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  const { status } = req.body;

  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "Not found" });

  if (ride.status === "NO_DRIVER_AVAILABLE") {
    return res.status(400).json({ error: "No driver assigned" });
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
  console.log("🚀 Step F server running (routes + dispatch)");
});
