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
  .then(() => console.log("🟢 DB connected"))
  .catch(err => console.log("🔴 DB error", err));

// =====================
// STATE
// =====================
let drivers = {};

// =====================
// DISTANCE (KM)
// =====================
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2)**2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// =====================
// ROUTE (OSRM)
// =====================
async function getRoute(a, b) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;

    const res = await axios.get(url);
    const route = res.data.routes?.[0];

    if (!route) return null;

    return {
      coords: route.geometry.coordinates,
      distance: route.distance,
      duration: route.duration
    };
  } catch {
    return null;
  }
}

// =====================
// MODEL
// =====================
const Ride = mongoose.model("Ride", new mongoose.Schema({
  userId: String,
  driverId: String,
  pickupText: String,
  dropText: String,
  pickup: Object,
  drop: Object,
  status: String,
  fare: Number,
  route: Object,
  createdAt: { type: Date, default: Date.now }
}));

// =====================
// SOCKET
// =====================
io.on("connection", (socket) => {

  socket.on("driver:online", (id) => {
    drivers[id] = { socketId: socket.id, busy: false };
  });

  socket.on("driver:offline", (id) => {
    delete drivers[id];
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
// FARE CALC (PLN)
// =====================
function calculateFare(distanceKm, type = "X") {
  const base = 5;

  const rates = {
    X: 2.2,
    COMFORT: 3.2,
    XL: 4.5
  };

  return Math.round(base + distanceKm * (rates[type] || 2.2));
}

// =====================
// CREATE RIDE
// =====================
app.post("/api/ride", async (req, res) => {
  const { userId, pickup, drop, pickupCoords, dropCoords, type } = req.body;

  let assigned = null;

  // nearest driver
  for (const id of Object.keys(drivers)) {
    if (!drivers[id].busy) {
      assigned = id;
      drivers[id].busy = true;
      break;
    }
  }

  const route = await getRoute(pickupCoords, dropCoords);

  const fare = route ? calculateFare(route.distance / 1000, type) : 20;

  const ride = await Ride.create({
    userId,
    driverId: assigned,
    pickupText: pickup,
    dropText: drop,
    pickup: pickupCoords,
    drop: dropCoords,
    status: assigned ? "ACCEPTED" : "NO_DRIVER_AVAILABLE",
    fare,
    route
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
// STATUS FLOW
// =====================
const flow = {
  ACCEPTED: "ARRIVING",
  ARRIVING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED"
};

// =====================
// UPDATE STATUS
// =====================
app.patch("/api/ride/:id/status", async (req, res) => {
  const { status } = req.body;

  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "not found" });

  if (!flow[ride.status] || flow[ride.status] !== status) {
    return res.status(400).json({ error: "invalid flow" });
  }

  ride.status = status;

  if (status === "COMPLETED") {
    if (drivers[ride.driverId]) drivers[ride.driverId].busy = false;
  }

  await ride.save();

  io.emit("ride:update", ride);

  res.json(ride);
});

// =====================
// CANCEL RIDE (NEW)
// =====================
app.patch("/api/ride/:id/cancel", async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  if (!ride) return res.status(404).json({ error: "not found" });

  ride.status = "CANCELLED";

  if (ride.driverId && drivers[ride.driverId]) {
    drivers[ride.driverId].busy = false;
  }

  await ride.save();

  io.emit("ride:update", ride);

  res.json(ride);
});

// =====================
// START
// =====================
server.listen(3000, () => {
  console.log("🚀 Step I Uber Engine Running");
});
