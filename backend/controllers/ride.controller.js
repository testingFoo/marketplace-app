const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const dispatch = require("../services/dispatch.service");

// ✅ IMPORTANT: import ONCE here
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
    const type = req.body?.type || "UBERX";

    const origin = req.body?.originCoords;
    const destination = req.body?.destinationCoords;

    if (!origin || !destination) {
      return res.status(400).json({ error: "Missing coords" });
    }

    let driver = null;

    try {
      if (dispatch?.findDriver) {
        driver = await dispatch.findDriver(type, origin);
      }
    } catch (e) {
      console.log("Dispatch error:", e);
    }

    const ride = await Ride.create({
      userId: req.body.userId || "demo-user",
      type,
      originCoords: origin,
      destinationCoords: destination,
      status: "REQUESTED",
      driverId: null,
      fare: Math.floor(Math.random() * 30) + 10
    });

    const io = req.app.get("io");
    if (io) io.emit("ride:new", ride);

    res.json(ride);

  } catch (err) {
    console.log("CREATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= ACCEPT RIDE =================
exports.acceptRide = async (req, res) => {
  try {
    const { driverId } = req.body;
    const rideId = req.params.id;

    if (!driverId) {
      return res.status(400).json({ error: "driverId required" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    // ✅ NEW STATUS FLOW
    ride.status = "DRIVER_ARRIVING";
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

    // ✅ SAFE CALL
    startDriverMovement(io, ride._id, coords);

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
    console.log("ACCEPT ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= GET RIDES =================
exports.getRides = async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
