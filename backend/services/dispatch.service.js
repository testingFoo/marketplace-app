
const Driver = require("../models/Driver");

exports.findDriver = async (type, originCoords) => {
  try {
    const drivers = await Driver.find({
      available: true,
      status: { $in: ["IDLE", "ONLINE"] }
    });

    if (!drivers || drivers.length === 0) return null;

    // safe sort
    const sorted = drivers.sort(
      (a, b) => (b.rating || 0) - (a.rating || 0)
    );

    return sorted[0] || null;

  } catch (err) {
    console.log("🔥 FIND DRIVER ERROR:", err);
    return null;
  }
};
