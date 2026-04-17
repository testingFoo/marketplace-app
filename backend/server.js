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
  .then(() => console.log("🟢 Mongo Connected"))
  .catch(err => console.log("🔴 Mongo Error", err));

// =====================
// STATE
// =====================
let drivers = {};        // { driverId: { socketId, busy, lat, lng } }

// =====================
// ROUTE ENGINE
// =====================
async function getRoute(p1, p2) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=full&geometries=geojson`;

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
// MODEL
// =====================
const rideSchema = new mongoose.Schema({
  userId: String,
  driverId: String,
  pickupText: String,
  dropText: String,
  pickup: Object,
  drop: Object,
  status: String,
  route: Object,
  createdAt: { type: Date, default: Date.now }
});

const Ride = mongoose.model("Ride", rideSchema);

// =====================
// SOCKET
// =====================
io.on("connection", (socket) => {

  socket.on("driver:online", (driverId) => {
    drivers[driverId] = { socketId: socket.id, busy: false };
    console.log("Driver online:", driverId);
  });

  socket.on("driver:offline", (driverId) => {
    delete drivers[driverId];
  });

  socket.on("driver:location", ({ driverId, lat, lng }) => {
    if (drivers[driverId]) {
      drivers[driverId].lat = lat;
      drivers[driverId].lng = lng;
    }

    io.emit("driver:move", { driverId, lat, lng });
  });
});

// =====================
// HEALTH
// =====================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState });
});

// =====================
// CREATE RIDE (CORE DISPATCH)
// =====================
app.post("/api/ride", async (req, res) => {
  const { userId, pickup, drop, pickupCoords, dropCoords } = req.body;

  let assignedDriver = null;

  for (const id of Object.keys(drivers)) {
    if (!drivers[id].busy) {
      assignedDriver = id;
      drivers[id].busy = true;
      break;
    }
  }

  const route = await getRoute(pickupCoords, dropCoords);

  const ride = await Ride.create({
    userId,
    driverId: assignedDriver,
    pickupText: pickup,
    dropText: drop,
    pickup: pickupCoords,
    drop: dropCoords,
    status: assignedDriver ? "ACCEPTED" : "NO_DRIVER_AVAILABLE",
    route
  });

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
// STATUS FLOW (STRICT)
// =====================
const flow = {
  ACCEPTED: "ARRIVING",
  ARRIVING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED"
};

app.patch("/api/ride/:id/status", async (req, res) => {
  const { status } = req.body;

  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "Not found" });

  if (!flow[ride.status] || flow[ride.status] !== status) {
    return res.status(400).json({ error: "Invalid transition" });
  }

  ride.status = status;

  if (status === "COMPLETED" && ride.driverId) {
    if (drivers[ride.driverId]) {
      drivers[ride.driverId].busy = false;
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
  console.log("🚀 Uber backend running (FINAL H)");
});
