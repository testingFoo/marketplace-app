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

// ================= DB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => console.log("🔴 Mongo Error", err));

// ================= STATE =================
let onlineDrivers = {};
let driverLocations = {};

// ================= ROUTE =================
async function getRoute(pickup, drop) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}` +
      `?overview=full&geometries=geojson`;

    const res = await axios.get(url);
    const route = res.data.routes[0];

    if (!route) return null;

    return {
      coords: route.geometry.coordinates,
      distance: route.distance, // meters
      duration: route.duration // seconds
    };
  } catch {
    return null;
  }
}

// ================= FARE =================
function calculateFare(distanceMeters, durationSeconds) {
  const base = 8; // PLN
  const perKm = 2.5;
  const perMin = 0.5;

  const km = distanceMeters / 1000;
  const min = durationSeconds / 60;

  return Math.round(base + km * perKm + min * perMin);
}

// ================= SOCKET =================
io.on("connection", (socket) => {

  socket.on("driver:online", (driverId) => {
    onlineDrivers[driverId] = { socketId: socket.id };
  });

  socket.on("driver:offline", (driverId) => {
    delete onlineDrivers[driverId];
  });

  socket.on("driver:location", (data) => {
    driverLocations[data.driverId] = {
      lat: data.lat,
      lng: data.lng
    };

    io.emit("driver:move", data);
  });

});

// ================= MODEL =================
const Ride = mongoose.model("Ride", new mongoose.Schema({
  userId: String,
  driverId: String,
  pickup: String,
  destination: String,
  pickupCoords: Object,
  dropCoords: Object,
  status: String,
  fare: Number,
  distance: Number,
  duration: Number,
  createdAt: { type: Date, default: Date.now }
}));

// ================= CREATE RIDE =================
app.post("/api/ride", async (req, res) => {
  const { pickup, destination, pickupCoords, dropCoords, userId } = req.body;

  const route = await getRoute(pickupCoords, dropCoords);

  let fare = 0;
  let distance = 0;
  let duration = 0;

  if (route) {
    fare = calculateFare(route.distance, route.duration);
    distance = route.distance;
    duration = route.duration;
  }

  const ride = await Ride.create({
    pickup,
    destination,
    pickupCoords,
    dropCoords,
    userId,
    status: "REQUESTED",
    fare,
    distance,
    duration
  });

  io.emit("ride:new", { ride, route });

  res.json({ ride, route });
});

// ================= ACCEPT RIDE =================
app.patch("/api/ride/:id/accept", async (req, res) => {
  const { driverId } = req.body;

  const ride = await Ride.findById(req.params.id);

  if (!ride || ride.status !== "REQUESTED") {
    return res.status(400).json({ error: "Not available" });
  }

  ride.status = "ACCEPTED";
  ride.driverId = driverId;

  await ride.save();

  io.emit("ride:update", ride);

  res.json(ride);
});

// ================= STATUS =================
app.patch("/api/ride/:id/status", async (req, res) => {
  const { status } = req.body;

  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "Not found" });

  ride.status = status;

  await ride.save();

  io.emit("ride:update", ride);

  res.json(ride);
});

// ================= CANCEL =================
app.patch("/api/ride/:id/cancel", async (req, res) => {
  const ride = await Ride.findById(req.params.id);

  if (!ride) return res.status(404).json({ error: "Not found" });

  ride.status = "CANCELLED";

  await ride.save();

  io.emit("ride:update", ride);

  res.json(ride);
});

// ================= GET =================
app.get("/api/rides", async (req, res) => {
  const rides = await Ride.find().sort({ createdAt: -1 });
  res.json(rides);
});

server.listen(3000, () => {
  console.log("🚀 Step J server running");
});
