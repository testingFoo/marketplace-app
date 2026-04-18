const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema({
  userId: String,
  name: String,
  car: String,
  plate: String,
  vehicleType: String, // UberX / Van / Freight
  rating: { type: Number, default: 4.8 },
  completedTrips: { type: Number, default: 500 },
  available: { type: Boolean, default: true }
});

module.exports = mongoose.model("Driver", DriverSchema);
