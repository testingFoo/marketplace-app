const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const dispatch = require("../services/dispatch.service");

const { startDriverMovement } = require("../services/driverMovement");

// ================= ROUTE =================
async function getRoute(origin, destination) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${process.env.MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) return null;

    return data.routes[0].geometry.coordinates;

  } catch (err) {
    console.log("Route error:", err);
    return null;
  }
}

// ================= CREATE =================
exports.createRide = async (req, res) => {
  try {
    const ride = await Ride.create({
      userId: req.body.userId || "demo",
      type: req.body.type || "UBERX",
      originCoords: req.body.originCoords,
      destinationCoords: req.body.destinationCoords,
      status: "REQUESTED",
      fare: 20
    });

    const io = req.app.get("io");
    io?.emit("ride:new", ride);

    res.json(ride);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

// ================= ACCEPT (FIXED) =================
exports.acceptRide = async (req, res) => {
  try {
    const { driverId } = req.body;
    const rideId = req.params.id;

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    ride.driverId = driverId;
    ride.status = "DRIVER_ARRIVING";

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

    console.log("MOVEMENT STARTING:", typeof startDriverMovement);

    if (io && startDriverMovement) {
      startDriverMovement(io, ride._id, coords);
    }

    io?.emit("ride:update", ride);

    res.json(ride);

  } catch (err) {
    console.log("🔥 ACCEPT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================= GET =================
exports.getRides = async (req, res) => {
  const rides = await Ride.find().sort({ createdAt: -1 });
  res.json(rides);
};
