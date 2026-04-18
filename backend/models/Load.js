const mongoose = require("mongoose");

const LoadSchema = new mongoose.Schema({
  origin: String,
  destination: String,

  equipment: String, // 53ft / Reefer / Box truck
  weight: String,
  rate: Number,
  distance: Number,

  status: {
    type: String,
    default: "AVAILABLE"
  },

  driverId: String
});

module.exports = mongoose.model("Load", LoadSchema);
