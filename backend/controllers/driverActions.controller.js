const Ride = require("../models/Ride");
const { startDriverMovement } = require("../sockets/driverMovement");

// ================= START TO PICKUP =================
exports.startToPickup = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    ride.status = "EN_ROUTE_TO_PICKUP";
    await ride.save();

    const io = req.app.get("io");
    startDriverMovement(io, ride._id, ride.routeCoords);

    io.emit("ride:update", ride);

    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================= ARRIVED =================
exports.arrivedAtPickup = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: "Ride not found" });

    ride.status = "AT_PICKUP";
    await ride.save();

    const io = req.app.get("io");
    io.emit("ride:update", ride);

    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    // restart movement for trip phase
    startDriverMovement(io, ride._id, ride.routeCoords, true);

    io.emit("ride:update", ride);

    res.json(ride);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
