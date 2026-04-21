const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

function interpolate(a, b, t) {
  return a + (b - a) * t;
}

function startDriverMovement(io, rideId, coords) {
  if (!coords || coords.length < 2) return;

  let index = 0;
  let progress = 0;

  const stepSpeed = 0.02; // smaller = smoother/slower

  const interval = setInterval(async () => {
    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.status === "COMPLETED") {
        clearInterval(interval);
        return;
      }

      const start = coords[index];
      const end = coords[index + 1];

      if (!start || !end) {
        clearInterval(interval);
        return;
      }

      progress += stepSpeed;

      if (progress >= 1) {
        progress = 0;
        index++;

        if (index >= coords.length - 1) {
          // COMPLETE RIDE
          await Ride.findByIdAndUpdate(rideId, {
            status: "COMPLETED"
          });

          if (ride.driverId) {
            await Driver.findByIdAndUpdate(ride.driverId, {
              status: "IDLE",
              available: true
            });
          }

          io.emit("ride-completed", { rideId });
          clearInterval(interval);
          return;
        }
      }

      const lng = interpolate(start[0], end[0], progress);
      const lat = interpolate(start[1], end[1], progress);

      if (ride.driverId) {
        await Driver.findByIdAndUpdate(ride.driverId, {
          location: { lat, lng }
        });
      }

      const remainingRatio = (coords.length - index) / coords.length;
      const etaSeconds = Math.round(remainingRatio * 300);

      io.emit("driver-location-update", {
        rideId,
        location: { lat, lng },
        etaSeconds,
        progress: index / coords.length
      });

    } catch (err) {
      console.log("Movement error:", err);
      clearInterval(interval);
    }
  }, 100);
}

module.exports = { startDriverMovement };
