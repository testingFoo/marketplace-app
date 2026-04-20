const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

function startDriverMovement(io, rideId, coords) {
  if (!coords || coords.length === 0) return;

  let index = 0;
  const total = coords.length;

  const interval = setInterval(async () => {
    const ride = await Ride.findById(rideId);

    if (!ride || ride.status === "COMPLETED") {
      clearInterval(interval);
      return;
    }

    const [lng, lat] = coords[index];

    // 🔥 BETTER ETA (distance-based approximation)
    const remainingRatio = (total - index) / total;
    const etaSeconds = Math.round(remainingRatio * 300); // ~5 min trip

    io.emit("driver-location-update", {
      rideId,
      location: { lat, lng },
      progress: index / total,
      etaSeconds
    });

    index++;

    if (index >= total) {
      await Ride.findByIdAndUpdate(rideId, {
        status: "COMPLETED"
      });

      io.emit("ride-completed", { rideId });

      clearInterval(interval);
    }

  }, 100); // 🔥 smoother: 10 updates per second
  
}

await Driver.findByIdAndUpdate(ride.driverId, {
  location: { lat, lng }
});


module.exports = { startDriverMovement };
