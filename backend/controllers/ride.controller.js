const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

// 🔥 IMPORTANT (MAKE SURE PATH IS CORRECT)
const { startDriverMovement } = require("../services/driverMovement");

// ================= GET ROUTE =================
async function getRoute(origin, destination) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${process.env.MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    // ✅ SUCCESS
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates;
    }

    console.log("⚠️ Mapbox returned no routes");

  } catch (err) {
    console.log("❌ Mapbox failed:", err.message);
  }

  // 🔥 FALLBACK (NEVER BREAK ACCEPT)
  return [
    [origin.lng, origin.lat],
    [destination.lng, destination.lat]
  ];
}

// ================= CREATE =================
exports.createRide = async (req, res) => {
  try {
    const { originCoords, destinationCoords } = req.body;

    if (!originCoords || !destinationCoords) {
      return res.status(400).json({ error: "Missing coords" });
    }

    const ride = await Ride.create({
      userId: "demo-user",
      type: "UBERX",
      originCoords,
      destinationCoords,
      status: "REQUESTED",
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

// ================= ACCEPT =================
exports.acceptRide = async (req, res) => {
  try {
    const { driverId } = req.body;
    const rideId = req.params.id;

    console.log("🚀 ACCEPT START", { driverId, rideId });

    if (!driverId) {
      return res.status(400).json({ error: "driverId required" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      console.log("❌ Ride not found");
      return res.status(404).json({ error: "Ride not found" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      console.log("❌ Driver not found");
      return res.status(404).json({ error: "Driver not found" });
    }

    ride.status = "DRIVER_ARRIVING";
    ride.driverId = driverId;

    let coords = await getRoute(
      ride.originCoords,
      ride.destinationCoords
    );

    if (!coords) {
      console.log("⚠️ Using fallback coords");
      coords = [
        [ride.originCoords.lng, ride.originCoords.lat],
        [ride.destinationCoords.lng, ride.destinationCoords.lat]
      ];
    }

    ride.routeCoords = coords;

    await ride.save();

    const io = req.app.get("io");

    console.log("📡 Starting movement...");
    console.log("startDriverMovement exists?", typeof startDriverMovement);

    // ✅ SAFE CALL (NO CRASH)
    if (typeof startDriverMovement === "function") {
      startDriverMovement(io, ride._id, coords);
    } else {
      console.log("❌ startDriverMovement is NOT a function");
    }

    if (io) {
      io.emit("ride:update", {
        ...ride.toObject(),
        routeCoords: coords
      });
    }

    console.log("✅ ACCEPT SUCCESS");

    res.json({
      ...ride.toObject(),
      routeCoords: coords
    });

  } catch (err) {
    console.log("🔥 ACCEPT ERROR FULL:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= DRIVER ARRIVED =================
exports.arrived = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    ride.status = "WAITING_START";
    await ride.save();

    const io = req.app.get("io");
    if (io) io.emit("ride:update", ride);

    res.json(ride);

  } catch (err) {
    console.log("ARRIVED ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= START TRIP =================
exports.startTrip = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    ride.status = "IN_PROGRESS";
    await ride.save();

    const io = req.app.get("io");
    if (io) io.emit("ride:update", ride);

    res.json(ride);

  } catch (err) {
    console.log("START ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= COMPLETE =================
exports.completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    ride.status = "COMPLETED";
    await ride.save();

    const io = req.app.get("io");
    if (io) io.emit("ride-completed", { rideId: ride._id });

    res.json(ride);

  } catch (err) {
    console.log("COMPLETE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= GET =================
exports.getRides = async (req, res) => {
  try {
    const rides = await Ride.find().sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.log("GET ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};
