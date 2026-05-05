const router = require("express").Router();
const { fetchEarthquakes } = require("../services/global.service");

// ================= SYNC GLOBAL DATA =================
router.get("/sync", async (req, res) => {
  try {
    const events = await fetchEarthquakes();

    req.app.get("io").emit("global:update", events);

    res.json({
      success: true,
      count: events.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
