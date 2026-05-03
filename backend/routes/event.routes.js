const router = require("express").Router();
const Event = require("../models/Event");

// GET ALL EVENTS (global feed)
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
