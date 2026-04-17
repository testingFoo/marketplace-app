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

// ================= DRIVER PROFILES =================
const drivers = {
  d1: { name: "Adam", rating: 4.8, car: "Toyota Prius", type: "UberX" },
  d2: { name: "Kasia", rating: 4.9, car: "BMW 5", type: "Comfort" },
  d3: { name: "Marek", rating: 4.7, car: "Van 7-Seater", type: "XL" }
};

// ================= ROUTE =================
async function getRoute(pickup, drop) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}` +
      `?overview=full&geometries=geojson`;

    const res = await axios.get(url);
    return res.data.routes[0];
  } catch {
    return null;
  }
}

// ================= FARE =================
function calculateFare(distance, duration, type) {
  let base = 8;
  let perKm = 2.5;
  let perMin = 0.5;

  if (type === "Comfort") base *= 1.5;
  if (type === "XL") base *= 2;

  // 🔥 Surge (simple)
  const hour = new Date().getHours();
  let surge = (hour >= 17 && hour <= 20) ? 1.5 : 1;

  return Math.round((base + (distance/1000)*perKm + (duration/60)*perMin) * surge);
}

// ================= MODEL =================
const Ride = mongoose.model("Ride", new mongoose.Schema({
  userId: String,
  driverId: String,
  driverInfo: Object,
  vehicleType: String,
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

// ================= CREATE =================
app.post("/api/ride", async (req, res) => {
  const { pickup, destination, pickupCoords, dropCoords, userId, vehicleType } = req.body;

  const route = await getRoute(pickupCoords, dropCoords);

  let distance = 0, duration = 0, fare = 0;

  if (route) {
    distance = route.distance;
    duration = route.duration;
    fare = calculateFare(distance, duration, vehicleType);
  }

  // assign random driver (simulate matching)
  const driverKeys = Object.keys(drivers);
  const driverId = driverKeys[Math.floor(Math.random() * driverKeys.length)];

  const ride = await Ride.create({
    pickup,
    destination,
    pickupCoords,
    dropCoords,
    userId,
    vehicleType,
    driverId,
    driverInfo: drivers[driverId],
    status: "REQUESTED",
    fare,
    distance,
    duration
  });

  io.emit("ride:new", { ride, route });

  res.json({ ride, route });
});

// ================= ACCEPT =================
app.patch("/api/ride/:id/accept", async (req, res) => {
  const { driverId } = req.body;
  const ride = await Ride.findById(req.params.id);

  ride.status = "ACCEPTED";
  ride.driverId = driverId;
  ride.driverInfo = drivers[driverId];

  await ride.save();

  io.emit("ride:update", ride);
  res.json(ride);
});

// ================= STATUS =================
app.patch("/api/ride/:id/status", async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  ride.status = req.body.status;
  await ride.save();

  io.emit("ride:update", ride);
  res.json(ride);
});

// ================= CANCEL =================
app.patch("/api/ride/:id/cancel", async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  ride.status = "CANCELLED";
  await ride.save();

  io.emit("ride:update", ride);
  res.json(ride);
});

// ================= GET =================
app.get("/api/rides", async (req, res) => {
  res.json(await Ride.find().sort({ createdAt: -1 }));
});

server.listen(3000, () => console.log("🚀 Step N server running"));
