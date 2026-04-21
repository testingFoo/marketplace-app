const router = require("express").Router();
const ctrl = require("../controllers/driver.controller");
const auth = require("../middleware/auth.middleware");

// existing routes
router.get("/", auth, ctrl.getProfile);
router.post("/", auth, ctrl.upsertProfile);
router.patch("/toggle", auth, ctrl.toggleAvailability);

// 🔥 ADD THIS (NO AUTH — used by your frontend driver.html)
const Driver = require("../models/Driver");

router.post("/init", async (req, res) => {
  try {
    const { userId, name, vehicleType } = req.body;

    let driver = await Driver.findOne({ userId });

    if (!driver) {
      driver = await Driver.create({
        userId,
        name,
        vehicleType: vehicleType || "UBERX",
        status: "IDLE",
        available: true
      });
    }

    res.json(driver);

  } catch (err) {
    console.log("driver init error:", err);
    res.status(500).json({ error: "Driver init failed" });
  }
});

module.exports = router;
