const Event = require("../models/Event");

// ================= NASA EONET =================
async function fetchGlobalEvents() {

  console.log("🌍 STARTING NASA FETCH");

  const response = await fetch(
    "https://eonet.gsfc.nasa.gov/api/v3/events",
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    }
  );

  console.log("✅ NASA RESPONSE:", response.status);

  const text = await response.text();

  console.log("📦 RESPONSE LENGTH:", text.length);

  let data;

  try {

    data = JSON.parse(text);

    console.log(
      "✅ JSON PARSED:",
      data.events?.length || 0
    );

  } catch (err) {

    console.log("❌ JSON PARSE FAILED");
    console.log(text.slice(0, 500));

    throw new Error("NASA JSON parse failed");
  }

  // ================= LOAD EXISTING IDS =================
  console.log("📂 LOADING EXISTING IDS");

  const existingIds = await Event.distinct(
    "data.eonetId"
  );

  console.log(
    "✅ EXISTING IDS:",
    existingIds.length
  );

  const events = [];

  // ================= INSERT =================
  for (const e of data.events || []) {

    if (events.length >= 50) {
      console.log("🛑 LIMIT REACHED");
      break;
    }

    if (existingIds.includes(e.id)) {
      continue;
    }

    const geo = e.geometry?.[0];

    if (!geo?.coordinates) continue;

    const lng = geo.coordinates[0];
    const lat = geo.coordinates[1];

    const category =
      e.categories?.[0]?.title || "Disaster";

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

    console.log(
      "➕ INSERTING:",
      e.title
    );

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
        category
      },

      source: "nasa"
    });

    events.push(event);
  }

  console.log(
    "✅ INSERT COMPLETE:",
    events.length
  );

  return events;
}

module.exports = {
  fetchGlobalEvents
};
