const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const dispatch = require("../services/dispatch.service");

async function getRoute(origin, destination) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${process.env.MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    return data.routes?.[0]?.geometry?.coordinates || null;
  } catch {
    return null;
  }
}

// ================= CREATE RIDE =================
exports.createRide = async (req, res) => {
  try {
    const ride = await Ride.create({
      ...req.body,
      status: "REQUESTED",
      fare: Math.floor(Math.random() * 30) + 10
    });

    const io = req.app.get("io");
    io?.emit("ride:new", ride);

    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ================= ACCEPT RIDE =================
exports.acceptRide = async (req, res) => {
  try {
    const { driverId } = req.body;
    const rideId = req.params.id;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    ride.status = "DRIVER_ARRIVING"; // 🔥 FIX
    ride.driverId = driverId;

    let coords = await getRoute(
      ride.originCoords,
      ride.destinationCoords
    );

    if (!coords) {
      coords = [
        [ride.originCoords.lng, ride.originCoords.lat],
        [ride.destinationCoords.lng, ride.destinationCoords.lat]
      ];
    }

    ride.routeCoords = coords;

    await ride.save();

    const io = req.app.get("io");

    startDriverMovement(io, ride._id, coords);

    io.emit("ride:update", {
      ...ride.toObject(),
      routeCoords: coords
    });

    res.json({
      ...ride.toObject(),
      routeCoords: coords
    });

  } catch (err) {
    console.log("acceptRide error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= DRIVER ARRIVED =================
exports.driverArrived = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    ride.status = "DRIVER_ARRIVED";

    await ride.save();

    req.app.get("io")?.emit("ride:update", ride);

    res.json(ride);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

// ================= START TRIP =================
exports.startTrip = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    ride.status = "IN_PROGRESS";

    await ride.save();

    req.app.get("io")?.emit("ride:update", ride);

    res.json(ride);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

// ================= COMPLETE =================
exports.completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    ride.status = "COMPLETED";

    await ride.save();

    req.app.get("io")?.emit("ride:update", ride);
    req.app.get("io")?.emit("ride-completed", { rideId: ride._id });

    res.json(ride);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};

// ================= GET RIDES =================
exports.getRides = async (req, res) => {
  const rides = await Ride.find().sort({ createdAt: -1 });
  res.json(rides);
};
