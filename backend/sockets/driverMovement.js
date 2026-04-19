const Ride = require("../models/Ride");

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

    const remaining = total - index;

    const etaSeconds = remaining * 2; // simple model

    // 🔥 REAL-TIME UPDATE
    io.emit("driver-location-update", {
      rideId,
      location: { lat, lng },
      index,
      total,
      etaSeconds
    });

    index++;

    // AUTO COMPLETE
    if (index >= total) {
      await Ride.findByIdAndUpdate(rideId, {
        status: "COMPLETED"
      });

      io.emit("ride-completed", { rideId });

      clearInterval(interval);
    }

  }, 1000); // 1 step per second (smooth simulation)
}

module.exports = { startDriverMovement };
