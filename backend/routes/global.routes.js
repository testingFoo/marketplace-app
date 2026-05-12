const router = require("express").Router();

const {
  fetchGlobalEvents
} = require("../services/global.service");

// ================= GLOBAL SYNC =================
router.get("/sync", async (req, res) => {

  const timeout = setTimeout(() => {

    res.status(504).json({
      error: "Sync timeout"
    });

  }, 25000);

  try {

    const start = Date.now();

    const events = await fetchGlobalEvents();

    clearTimeout(timeout);

    req.app.get("io").emit(
      "global:update",
      events
    );

    const ms = Date.now() - start;

    res.json({
      success: true,
      inserted: events.length,
      tookMs: ms
    });

  } catch (err) {

    clearTimeout(timeout);

    console.log("GLOBAL SYNC ERROR:");
    console.log(err);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;
