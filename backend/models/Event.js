const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    index: true
    // weather | traffic | disaster | ride | user_action | etc
  },

  severity: {
    type: Number,
    default: 1
    // 1 = low, 5 = critical
  },

  location: {
    lat: Number,
    lng: Number,
    radius: Number
  },

  time: {
    start: {
      type: Date,
      default: Date.now
    },
    end: Date
  },

  source: {
    type: String,
    default: "system"
    // api | user | ai | system
  },

  data: {
    type: Object,
    default: {}
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model("Event", EventSchema);
