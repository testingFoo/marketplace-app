const router = require("express").Router();

const {
  fetchGlobalEvents
} = require("../services/global.service");

// ================= GLOBAL SYNC =================
router.get("/sync", async (req, res) => {

  try {

    const events = await fetchGlobalEvents();

    req.app.get("io").emit(
      "global:update",
      events
    );

    res.json({
      success: true,
      count: events.length,
      events
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;
