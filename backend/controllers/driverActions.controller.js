const Ride = require("../models/Ride");
const { startDriverMovement } = require("../services/driverMovement");

// START → GO TO PICKUP
exports.startToPickup = async (req, res) => {
  const ride = await Ride.findById(req.params.id);

  ride.status = "EN_ROUTE_TO_PICKUP";
  await ride.save();

  const io = req.app.get("io");

  startDriverMovement(io, ride._id, ride.routeCoords, false);

  io.emit("ride:update", ride);

  res.json(ride);
};

// ARRIVED
exports.arrived = async (req, res) => {
  const ride = await Ride.findById(req.params.id);

  ride.status = "AT_PICKUP";
  await ride.save();

  const io = req.app.get("io");
  io.emit("ride:update", ride);

  res.json(ride);
};

// START TRIP
exports.startTrip = async (req, res) => {
  const ride = await Ride.findById(req.params.id);

  ride.status = "IN_PROGRESS";
  await ride.save();

  const io = req.app.get("io");

  startDriverMovement(io, ride._id, ride.routeCoords, true);

  io.emit("ride:update", ride);

  res.json(ride);
};
