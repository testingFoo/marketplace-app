const { startDriverMovement } = require("../sockets/driverMovement");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const dispatch = require("../services/dispatch.service");

exports.createRide = async (req, res) => {
  try {
    const io = req.app.get("io");

    const driver = await dispatch.findDriver(req.body.type);

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

    if (io) io.emit("ride:new", ride);

    res.json(ride);

  } catch (err) {
    console.log("createRide error:", err);
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
