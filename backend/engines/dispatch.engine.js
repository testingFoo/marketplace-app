const Driver = require("../models/Driver");
const geo = require("../services/geo.service");

// MAIN DISPATCH FUNCTION
exports.findBestDriver = async (pickupCoords, type) => {
  try {
    const drivers = await Driver.find({
      status: "IDLE",
      available: true,
      vehicleType: type
    });

    if (!drivers.length) return null;

    const scored = drivers.map(driver => {
      const distance = geo.calculateDistance(
        driver.location.lat,
        driver.location.lng,
        pickupCoords.lat,
        pickupCoords.lng
      );

      // closer = better
      const distanceScore = Math.max(0, 100 - distance * 10);

      const ratingScore = (driver.rating || 4.5) * 10;

      const totalScore = distanceScore + ratingScore;

      return {
        driver,
        score: totalScore
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored[0].driver;

  } catch (err) {
    console.log("Dispatch error:", err);
    return null;
  }
};
