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
// ================= FEED =================
router.get("/", async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
