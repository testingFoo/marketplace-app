const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

function startDriverMovement(io, rideId, coords) {
  if (!coords || coords.length === 0) return;

  let index = 0;
  const total = coords.length;

  const interval = setInterval(async () => {
    try {
      const ride = await Ride.findById(rideId);

      if (!ride || ride.status === "COMPLETED") {
        clearInterval(interval);
        return;
      }

      const [lng, lat] = coords[index];

      // 🔥 UPDATE DRIVER LOCATION IN DB
      if (ride.driverId) {
        await Driver.findByIdAndUpdate(ride.driverId, {
          location: { lat, lng }
        });
      }

      // ETA calculation
      const remainingRatio = (total - index) / total;
      const etaSeconds = Math.round(remainingRatio * 300);

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

        // 🔥 FREE DRIVER AGAIN
        if (ride.driverId) {
          await Driver.findByIdAndUpdate(ride.driverId, {
            status: "IDLE",
            available: true
          });
        }

        io.emit("ride-completed", { rideId });

        clearInterval(interval);
      }

    } catch (err) {
      console.log("Movement error:", err);
      clearInterval(interval);
    }

  }, 300); // slower = more stable
}

module.exports = { startDriverMovement };
