const router = require("express").Router();
const Event = require("../models/Event");
const { fetchWeatherAndCreateEvents } = require("../services/weather.service");

// ================= WEATHER ENDPOINT =================
router.get("/weather", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const event = await fetchWeatherAndCreateEvents({ lat, lng });

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ALL EVENTS =================
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
