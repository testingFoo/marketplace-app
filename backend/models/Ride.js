const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema({
  type: String, // PASSENGER | PARCEL | FREIGHT

  origin: String,
  destination: String,

  originCoords: Object,
  destinationCoords: Object,
{ timestamps: true },
  status: {
    type: String,
    default: "REQUESTED"
  },

  riderId: String,
  driverId: String,

  fare: Number,

  // freight fields
  equipment: String,
  weight: String,
  distance: Number,
  rate: Number
});

module.exports = mongoose.model("Ride", RideSchema);
