const Event = require("../models/Event");

async function fetchEarthquakes() {

  const response = await fetch(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/medium_day.geojson"
  );

  // ✅ SAFE TEXT FIRST
  const text = await response.text();
  console.log(text.slice(0, 500));

  let data;

  try {
    data = JSON.parse(text);
  } catch (err) {
    console.log("USGS INVALID RESPONSE:");
    console.log(text);

    throw new Error("USGS returned invalid JSON");
  }

  const features = data.features || [];

  const events = [];

  for (const f of features) {

    if (!f.geometry?.coordinates) continue;

    const [lng, lat] = f.geometry.coordinates;

    // prevent duplicates
    const exists = await Event.findOne({
      "data.usgsId": f.id
    });

    if (exists) continue;

    const event = await Event.create({
      type: "disaster",

      severity: Math.min(
        Math.max(Math.round(f.properties.mag || 1), 1),
        5
      ),

      location: {
        lat,
        lng
      },

      data: {
        usgsId: f.id,
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
