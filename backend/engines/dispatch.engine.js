const Driver = require("../models/Driver");

// GEO + SCORE BASED MATCHING
exports.findBestDriver = async (pickup, type) => {

  const drivers = await Driver.find({
    status: "IDLE",
    available: true,
    vehicleType: type
  });

  if (!drivers.length) return null;

  const scored = drivers.map(driver => {
    const distanceScore = getDistanceScore(driver.location, pickup);
    const ratingScore = driver.rating * 10;

    const totalScore = distanceScore + ratingScore;

    return {
      driver,
      score: totalScore
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored[0].driver;
};

// simple geo function (temporary)
function getDistanceScore(driverLoc, pickupLoc) {
  if (!driverLoc || !pickupLoc) return 0;

  const dx = driverLoc.lat - pickupLoc.lat;
  const dy = driverLoc.lng - pickupLoc.lng;

  const distance = Math.sqrt(dx * dx + dy * dy);

  return Math.max(0, 100 - distance * 100);
}
