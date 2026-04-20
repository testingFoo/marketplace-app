const { startDriverMovement } = require("../sockets/driverMovement");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const dispatch = require("../services/dispatch.service");
const fetch = require("node-fetch");

async function getRoute(origin, destination) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${process.env.MAPBOX_TOKEN}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.routes[0].geometry.coordinates;
}

exports.acceptRide = async (req, res) => {
  try {
    const { driverId } = req.body;
    const rideId = req.params.id;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    ride.status = "ACCEPTED";
    ride.driverId = driverId;

    await ride.save();

    // 🔥 THIS IS WHAT YOU WERE MISSING
    const io = req.app.get("io");

    if (ride.originCoords && ride.destinationCoords) {
     const coords = await getRoute(
  ride.originCoords,
  ride.destinationCoords
);
      startDriverMovement(io, ride._id, coords);
    }

    io.emit("ride:update", ride);

    res.json(ride);

  } catch (err) {
    console.log("Accept error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const io = req.app.get("io");

    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    ride.status = req.body.status;

    if (req.body.status === "COMPLETED") {
      await Driver.findByIdAndUpdate(ride.driverId, {
        available: true,
        $inc: { completedTrips: 1 }
      });
    }

    await ride.save();

    if (io) io.emit("ride:update", ride);

    res.json(ride);

  } catch (err) {
    console.log("updateStatus error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.acceptRide = async (req, res) => {
  try {
    const io = req.app.get("io");

    const { id } = req.params;
    const { driverId } = req.body;

    const ride = await Ride.findByIdAndUpdate(
      id,
      { driverId, status: "ACCEPTED" },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    if (ride?.originCoords && ride?.destinationCoords) {
      const routeCoords = ride.routeCoords || ride.originCoords;
      startDriverMovement(io, ride._id, routeCoords);
    }

    if (io) io.emit("ride:update", ride);

    res.json(ride);

  } catch (err) {
    console.log("acceptRide error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


exports.getRides = async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.log("getRides error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
