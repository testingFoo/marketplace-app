const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: { origin: "*" }
});

// ================= DATA =================
let rides = [];
let drivers = {};

// ================= VEHICLE TYPES =================
const VEHICLES = ["UberX", "Comfort", "7-Seater", "Parcel", "LTL", "FTL"];

// ================= DRIVER INIT =================
function ensureDriver(id) {
  if (!drivers[id]) {
    drivers[id] = {
      id,
      rating: +(Math.random() * 2 + 3).toFixed(1),
      completed: Math.floor(Math.random() * 4500 + 500),
      vehicle: VEHICLES[Math.floor(Math.random() * VEHICLES.length)],
      available: true
    };
  }
}

// ================= SOCKET =================
io.on("connection", (socket) => {

  socket.on("driver:online", (driverId) => {
    ensureDriver(driverId);
  });

  socket.on("driver:location", (data) => {
    ensureDriver(data.driverId);

    io.emit("driver:location:update", data);
  });
});

// ================= DISPATCH =================
function findDriver(type) {
  return Object.values(drivers)
    .filter(d => d.available)
    .sort((a, b) => b.rating - a.rating)[0];
}

// ================= CREATE RIDE =================
app.post("/api/ride", (req, res) => {

  const driver = findDriver(req.body.type);

  const ride = {
    _id: Date.now().toString(),

    type: req.body.type, // PASSENGER | PARCEL | FREIGHT

    origin: req.body.origin,
    destination: req.body.destination,

    status: driver ? "ACCEPTED" : "REQUESTED",

    driverId: driver ? driver.id : null,

    riderId: "R-" + Math.floor(Math.random() * 99999),

    equipment: req.body.equipment || null,
    weight: req.body.weight || null,
    rate: req.body.rate || null,
    distance: req.body.distance || null
  };

  if (driver) driver.available = false;

  rides.push(ride);

  io.emit("ride:new", ride);

  res.json(ride);
});

// ================= ACCEPT =================
app.patch("/api/ride/:id/accept", (req, res) => {

  const ride = rides.find(r => r._id === req.params.id);

  if (!ride) return res.json({ error: "not found" });

  ride.status = "ACCEPTED";
  ride.driverId = req.body.driverId;

  if (drivers[req.body.driverId]) {
    drivers[req.body.driverId].available = false;
  }

  io.emit("ride:update", ride);

  res.json(ride);
});

// ================= STATUS FLOW =================
app.patch("/api/ride/:id/status", (req, res) => {

  const ride = rides.find(r => r._id === req.params.id);

  if (!ride) return res.json({ error: "not found" });

  ride.status = req.body.status;

  if (req.body.status === "COMPLETED") {
    if (drivers[ride.driverId]) {
      drivers[ride.driverId].available = true;
    }
  }

  io.emit("ride:update", ride);

  res.json(ride);
});

// ================= GET =================
app.get("/api/rides", (req, res) => res.json(rides));
app.get("/api/drivers", (req, res) => res.json(drivers));

// ================= START =================
server.listen(10000, () => {
  console.log("Stealth dispatch running");
});
