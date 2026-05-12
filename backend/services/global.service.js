const Event = require("../models/Event");

// ================= NASA EONET =================
async function fetchGlobalEvents() {

  const response = await fetch(
    "https://eonet.gsfc.nasa.gov/api/v3/events",
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    }
  );

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch (err) {
    console.log("NASA RESPONSE:");
    console.log(text);

    throw new Error("NASA EONET returned invalid JSON");
  }

  const events = [];

  for (const e of data.events || []) {

    const geo = e.geometry?.[0];

    if (!geo?.coordinates) continue;

    const lng = geo.coordinates[0];
    const lat = geo.coordinates[1];

    // avoid duplicates
    const exists = await Event.findOne({
      "data.eonetId": e.id
    });

    if (exists) continue;

    const category =
      e.categories?.[0]?.title || "Disaster";

    // dynamic severity
    let severity = 2;

    if (
      category.includes("Wildfires") ||
      category.includes("Volcanoes")
    ) {
      severity = 5;
    }

    if (
      category.includes("Severe Storms")
    ) {
      severity = 4;
    }

    const event = await Event.create({
      type: "disaster",

      severity,

      location: {
        lat,
        lng
      },

      data: {
        eonetId: e.id,
        title: e.title,
        category,
        source: e.sources?.[0]?.id
      },

      source: "nasa"
    });

    events.push(event);
  }

  return events;
}

module.exports = {
  fetchGlobalEvents
};
