const Driver = require("../models/Driver");

exports.findDriver = async (type, originCoords) => {
  try {
    if (!originCoords?.lng || !originCoords?.lat) {
      console.log("Invalid originCoords:", originCoords);
      return null;
    }

    const drivers = await Driver.find({
      available: true,
      type: type
    });

    if (!drivers || drivers.length === 0) {
      return null;
    }

    // sort by rating (safe fallback)
    const sorted = drivers.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return sorted[0] || null;

  } catch (err) {
    console.log("findDriver error:", err);
    return null;
  }
};
