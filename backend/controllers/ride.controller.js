const { startDriverMovement } = require("../sockets/driverMovement");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const dispatch = require("../services/dispatch.service");

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
      const coords = [
        [ride.originCoords.lng, ride.originCoords.lat],
        [ride.destinationCoords.lng, ride.destinationCoords.lat]
      ];

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
