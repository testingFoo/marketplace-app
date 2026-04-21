const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const dispatch = require("../services/dispatch.service");
const { startDriverMovement } = require("../sockets/driverMovement");

// ================= GET MAPBOX ROUTE =================
async function getRoute(origin, destination) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${process.env.MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) return null;

    return data.routes[0].geometry.coordinates;

  } catch (err) {
    console.log("Route fetch error:", err);
    return null;
  }
}

// ================= CREATE RIDE =================
exports.createRide = async (req, res) => {
  try {

    console.log("REQ BODY:", req.body);

    const originCoords = req.body.originCoords;

    const normalizedOrigin = Array.isArray(originCoords)
      ? { lng: originCoords[0], lat: originCoords[1] }
      : originCoords;

    let driver = null;

    try {
      driver = await dispatch.findDriver(req.body.type, normalizedOrigin);
    } catch (e) {
      console.log("Dispatch error:", e);
    }

    const ride = await Ride.create({
      ...req.body,
      status: driver ? "ACCEPTED" : "REQUESTED",
      driverId: driver ? driver._id : null,
      fare: Math.floor(Math.random() * 30) + 10
    });

    if (driver) {
      driver.available = false;
      await driver.save();
    }

    const io = req.app.get("io");
    if (io) io.emit("ride:new", ride);

    res.json(ride);

  } catch (err) {
    console.error("createRide error:", err);
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

    const driver = await Driver.findById(driverId);

    ride.status = "ACCEPTED";
    ride.driverId = driverId;

    let coords = await getRoute(ride.originCoords, ride.destinationCoords);

    if (!coords) {
      coords = [
        [ride.originCoords.lng, ride.originCoords.lat],
        [ride.destinationCoords.lng, ride.destinationCoords.lat]
      ];
    }

    ride.routeCoords = coords;
    await ride.save();

    const io = req.app.get("io");

    // 🚀 START FULL SIMULATION (driver → pickup → destination)
    const { startDriverMovement } = require("../sockets/driverMovement");

    startDriverMovement(
      io,
      ride._id,
      coords,
      driver.location,
      ride.originCoords
    );

    if (io) {
      io.emit("ride:update", {
        ...ride.toObject(),
        routeCoords: coords
      });
    }

    res.json({
      ...ride.toObject(),
      routeCoords: coords
    });

  } catch (err) {
    console.log("acceptRide error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= UPDATE STATUS =================
exports.updateStatus = async (req, res) => {
  try {
    const io = req.app.get("io");

    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

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

// ================= GET RIDES =================
exports.getRides = async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.log("getRides error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
