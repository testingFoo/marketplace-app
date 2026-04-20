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
      enum: ["REQUESTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "REQUESTED"
    },

    originCoords: {
      lng: { type: Number, required: true },
      lat: { type: Number, required: true }
    },

    destinationCoords: {
      lng: { type: Number, required: true },
      lat: { type: Number, required: true }
    },

    fare: {
      type: Number,
      default: 0
    },

    distance: {
      type: Number,
      default: 0
    },

    duration: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Ride", RideSchema);
