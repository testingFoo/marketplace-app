const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    index: true,
  },

  severity: {
    type: Number,
    default: 1,
  },

  location: {
    lat: Number,
    lng: Number,
    radius: Number,
  },

  time: {
    start: {
      type: Date,
      default: Date.now,
    },

    end: Date,
  },

  source: {
    type: String,
    default: "system",
    index: true,
  },

  data: {
    type: Object,
    default: {},
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// ✅ IMPORTANT FOR NASA DUPLICATE CHECKS
EventSchema.index({
  "data.eonetId": 1,
});

module.exports = mongoose.model(
  "Event",
  EventSchema
);
