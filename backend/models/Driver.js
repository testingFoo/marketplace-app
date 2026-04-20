const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema({
  userId: String,
  name: String,
  car: String,
  plate: String,

  vehicleType: {
    type: String,
    enum: ["UBERX", "VAN", "FREIGHT"],
    default: "UBERX"
  },

  rating: { type: Number, default: 4.8 },
  completedTrips: { type: Number, default: 500 },

  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },

  status: {
    type: String,
    enum: ["OFFLINE", "ONLINE", "IDLE", "EN_ROUTE", "ON_TRIP"],
    default: "IDLE"
  },

  available: { type: Boolean, default: true }
});

// 🔥 FIX: prevent overwrite error
module.exports = mongoose.models.Driver || mongoose.model("Driver", DriverSchema);
