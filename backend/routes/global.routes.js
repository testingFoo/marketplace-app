const router = require("express").Router();

const {
  fetchGlobalEvents
} = require("../services/global.service");

// ================= GLOBAL SYNC =================
router.get("/sync", async (req, res) => {

  try {

    const start = Date.now();

    const events = await fetchGlobalEvents();

    req.app.get("io").emit(
      "global:update",
      events
    );

    const ms = Date.now() - start;

    // ✅ LIGHT RESPONSE ONLY
    res.json({
      success: true,
      inserted: events.length,
      tookMs: ms
    });

  } catch (err) {

    console.log("GLOBAL SYNC ERROR:");
    console.log(err);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;
