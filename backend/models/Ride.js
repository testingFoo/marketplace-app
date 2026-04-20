const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema({
  userId: String,
  name: String,

  // vehicle capability
  vehicleType: {
    type: String,
    enum: ["UBERX", "VAN", "FREIGHT"],
    required: true
  },

  car: String,
  plate: String,

  rating: { type: Number, default: 4.8 },
  completedTrips: { type: Number, default: 500 },

  // 🔥 CORE UPGRADE #1: LOCATION
  location: {
    lat: Number,
    lng: Number
  },

  // 🔥 CORE UPGRADE #2: DRIVER STATE
  status: {
    type: String,
    enum: ["OFFLINE", "ONLINE", "IDLE", "EN_ROUTE", "ON_TRIP"],
    default: "OFFLINE"
  },

  // 🔥 CORE UPGRADE #3: REAL-TIME TRACKING
  lastSeen: {
    type: Date,
    default: Date.now
  },

  available: { type: Boolean, default: true }
});

module.exports = mongoose.model("Driver", DriverSchema);
