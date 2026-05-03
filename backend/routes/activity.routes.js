const router = require("express").Router();
const Activity = require("../models/Activity");

// GET FEED (GLOBAL or USER BASED LATER)
router.get("/", async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("userId", "firstName lastName email");

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
