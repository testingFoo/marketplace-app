const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

// ================= GET ROUTE =================
async function getRoute(origin, destination) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${process.env.MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    // ✅ SUCCESS CASE
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates;
    }

    console.log("⚠️ Mapbox returned no routes");

  } catch (err) {
    console.log("❌ Mapbox failed:", err.message);
  }

  // 🔥 FALLBACK (ALWAYS WORKS)
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

    const ride = await Ride.findById(rideId);
    const driver = await Driver.findById(driverId);

    if (!ride || !driver) {
      return res.status(404).json({ error: "Ride/Driver not found" });
    }

    ride.status = "DRIVER_ASSIGNED";
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
    if (io) io.emit("ride:update", ride);

    res.json(ride);

  } catch (err) {
    console.log("ACCEPT ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ================= GET =================
exports.getRides = async (req, res) => {
  const rides = await Ride.find().sort({ createdAt: -1 });
  res.json(rides);
};
