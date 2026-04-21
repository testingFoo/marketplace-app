const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null
    },

    type: {
      type: String,
      enum: ["UBERX", "VAN", "FREIGHT"],
      required: true
    },

    status: {
      type: String,
      enum: [
        "REQUESTED",
        "DRIVER_ARRIVING",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "REQUESTED"
    },

    originCoords: {
      lng: Number,
      lat: Number
    },

    destinationCoords: {
      lng: Number,
      lat: Number
    },

    // 🔥 ADD THIS (CRITICAL)
    routeCoords: {
      type: [[Number]],
      default: []
    },

    fare: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ride", RideSchema);
