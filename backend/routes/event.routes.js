const router = require("express").Router();
const Event = require("../models/Event");

const {
  fetchWeatherAndCreateEvents,
  fetchWeatherLive
} = require("../services/weather.service");

const { generateTrafficEvent } = require("../services/traffic.service");
const { generateDisasterEvent } = require("../services/disaster.service");

// ================= WEATHER (EVENT) =================
router.get("/weather", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const event = await fetchWeatherAndCreateEvents({ lat, lng });

    req.app.get("io").emit("event:new", event);

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= WEATHER LIVE (NO DB) =================
router.get("/weather/live", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const data = await fetchWeatherLive({ lat, lng });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= TRAFFIC =================
router.get("/traffic", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const event = await generateTrafficEvent({ lat, lng });

    req.app.get("io").emit("event:new", event);

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DISASTERS =================
router.get("/disasters", async (req, res) => {
  try {
    const events = await generateDisasterEvents();

    events.forEach((e) => {
      req.app.get("io").emit("event:new", e);
    });

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= FEED (GEOJSON READY) =================
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().limit(100);

    const geojson = {
      type: "FeatureCollection",
      features: events.map((e) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [e.location.lng, e.location.lat]
        },
        properties: {
          type: e.type,
          severity: e.severity,
          data: e.data
        }
      }))
    };

    res.json(geojson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
