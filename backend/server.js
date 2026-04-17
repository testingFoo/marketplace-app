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
let onlineDrivers = {}; // driverId → { socketId, lat, lng }

// ================= ROUTE =================
async function getRoute(pickup, drop) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}` +
      `?overview=full&geometries=geojson`;

    const res = await axios.get(url);
    const route = res.data.routes[0];

    return route
      ? {
          coords: route.geometry.coordinates,
          distance: route.distance,
          duration: route.duration
        }
      : null;
  } catch {
    return null;
  }
}

// ================= DISTANCE =================
function getDistance(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) *
    Math.cos(b.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

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
  route: Object
}));

// ================= SOCKET =================
io.on("connection", (socket) => {

  socket.on("driver:online", (driverId) => {
    onlineDrivers[driverId] = { socketId: socket.id };
  });

  socket.on("driver:location", ({ driverId, lat, lng }) => {
    if (onlineDrivers[driverId]) {
      onlineDrivers[driverId].lat = lat;
      onlineDrivers[driverId].lng = lng;
    }

    io.emit("driver:move", { driverId, lat, lng });
  });

  socket.on("driver:offline", (driverId) => {
    delete onlineDrivers[driverId];
  });

});

// ================= DISPATCH FUNCTION =================
async function dispatchRide(ride) {
  const drivers = Object.entries(onlineDrivers)
    .filter(([_, d]) => d.lat && d.lng)
    .sort((a, b) => {
      const d1 = getDistance(ride.pickupCoords, a[1]);
      const d2 = getDistance(ride.pickupCoords, b[1]);
      return d1 - d2;
    });

  for (const [driverId, driver] of drivers) {
    console.log("📡 Sending to driver:", driverId);

    io.to(driver.socketId).emit("ride:request", ride);

    // wait 10 sec
    const accepted = await new Promise(resolve => {
      const timeout = setTimeout(() => resolve(false), 10000);

      io.once("ride:accepted", (data) => {
        if (data.rideId === ride._id.toString()) {
          clearTimeout(timeout);
          resolve(true);
        }
      });
    });

    if (accepted) return;
  }

  // none accepted
  ride.status = "NO_DRIVER_AVAILABLE";
  await ride.save();
  io.emit("ride:update", ride);
}

// ================= CREATE =================
app.post("/api/ride", async (req, res) => {
  const { pickup, destination, pickupCoords, dropCoords, userId } = req.body;

  const route = await getRoute(pickupCoords, dropCoords);

  const ride = await Ride.create({
    pickup,
    destination,
    pickupCoords,
    dropCoords,
    userId,
    status: "SEARCHING",
    fare: route ? Math.round(route.distance / 1000 * 3) : 0,
    route
  });

  dispatchRide(ride);

  res.json(ride);
});

// ================= ACCEPT =================
app.patch("/api/ride/:id/accept", async (req, res) => {
  const { driverId } = req.body;

  const ride = await Ride.findById(req.params.id);

  ride.status = "ACCEPTED";
  ride.driverId = driverId;

  await ride.save();

  io.emit("ride:accepted", { rideId: ride._id.toString() });
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

// ================= GET =================
app.get("/api/rides", async (req, res) => {
  res.json(await Ride.find().sort({ _id: -1 }));
});

server.listen(3000, () => {
  console.log("🚀 STEP O DISPATCH RUNNING");
});
