const Driver = require("../models/DriverProfile");

// CREATE / UPDATE PROFILE
exports.upsertProfile = async (req, res) => {
  const profile = await Driver.findOneAndUpdate(
    { userId: req.user.id },
    req.body,
    { new: true, upsert: true }
  );

  res.json(profile);
};

// TOGGLE AVAILABILITY
exports.toggleAvailability = async (req, res) => {
  const driver = await Driver.findOne({ userId: req.user.id });

  driver.available = !driver.available;
  await driver.save();

  res.json(driver);
};

// GET PROFILE
exports.getProfile = async (req, res) => {
  const driver = await Driver.findOne({ userId: req.user.id });
  res.json(driver);
};
