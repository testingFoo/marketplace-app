const Event = require("../models/Event");

async function fetchGlobalEvents() {
  const response = await fetch(
    "https://eonet.gsfc.nasa.gov/api/v3/events",
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json"
      }
    }
  );

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("NASA parse failed");
  }

  const existing = new Set(
    await Event.find({ "data.eonetId": { $exists: true } }).distinct(
      "data.eonetId"
    )
  );

  const events = [];

  for (const e of data.events || []) {
    if (events.length >= 50) break;
    if (existing.has(e.id)) continue;

    const geo = e.geometry?.[0];
    if (!geo?.coordinates) continue;

    const [lng, lat] = geo.coordinates;

    const category = e.categories?.[0]?.title || "Disaster";

    const severity =
      category.includes("Wildfires") || category.includes("Volcanoes")
        ? 5
        : category.includes("Storms")
        ? 4
        : 2;

    const event = await Event.create({
      type: "disaster",
      severity,
      location: { lat, lng },
      data: {
        eonetId: e.id,
        title: e.title,
        category
      },
      source: "nasa"
    });

    events.push(event);
  }

  return events;
}

module.exports = { fetchGlobalEvents };
