const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

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
// DRIVER STATE
// =====================
let onlineDrivers = {};
let driverLocations = {};

// =====================
// DISTANCE FUNCTION (Haversine)
// =====================
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
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
// CREATE RIDE (NEAREST DRIVER LOGIC)
// =====================
app.post("/api/ride", async (req, res) => {
  const { pickup, destination, userId } = req.body;

  let bestDriver = null;
  let bestDistance = Infinity;

  // Fake pickup coords (you can later replace with real geocoding)
  const pickupLat = 52.2297;
  const pickupLng = 21.0122;

  for (const driverId of Object.keys(onlineDrivers)) {
    const loc = driverLocations[driverId];

    if (!loc) continue;
    if (onlineDrivers[driverId].busy) continue;

    const dist = getDistance(
      pickupLat,
      pickupLng,
      loc.lat,
      loc.lng
    );

    if (dist < bestDistance) {
      bestDistance = dist;
      bestDriver = driverId;
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

  res.json({
    ride,
    eta: bestDistance !== Infinity ? `${Math.round(bestDistance * 3)} min` : null
  });
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
  console.log("🚀 Server running with Step E logic");
});
