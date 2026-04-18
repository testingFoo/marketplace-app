const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema({
  userId: String,

  name: String,
  car: String,
  plate: String,

  vehicleType: {
    type: String,
    enum: ["UberX", "Comfort", "Van", "LTL", "FTL"]
  },

  fleetCompany: String,
  avatar: String,

  rating: { type: Number, default: 4.8 },
  completedTrips: { type: Number, default: 500 },

  available: { type: Boolean, default: false }
});

module.exports = mongoose.model("DriverProfile", DriverSchema);
