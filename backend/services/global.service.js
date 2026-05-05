const Event = require("../models/Event");

// ================= USGS EARTHQUAKES =================
async function fetchEarthquakes() {
  const res = await fetch(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/medium_day.geojson"
  );

  const data = await res.json();

  const features = data.features || [];

  const events = [];

  for (const f of features) {
    const [lng, lat] = f.geometry.coordinates;

    const event = await Event.create({
      type: "disaster",
      severity: Math.min(Math.round(f.properties.mag), 5),
      location: { lat, lng },
      data: {
        title: f.properties.title,
        magnitude: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time
      },
      source: "usgs"
    });

    events.push(event);
  }

  return events;
}

module.exports = { fetchEarthquakes };
