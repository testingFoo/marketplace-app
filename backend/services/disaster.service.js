const Event = require("../models/Event");

async function generateDisasterEvent({ lat, lng }) {
  if (!lat || !lng) {
    throw new Error("Missing lat/lng");
  }

  // simulate rare disaster
  const isDisaster = Math.random() > 0.85;

  if (!isDisaster) {
    return null;
  }

  const event = await Event.create({
    type: "disaster",
    severity: 4,
    location: {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    },
    data: {
      description: "Potential hazard detected"
    },
    source: "system"
  });

  return event;
}

module.exports = { generateDisasterEvent };
