const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

function interpolate(a, b, t) {
  return a + (b - a) * t;
}

function startDriverMovement(io, rideId, coords) {
  if (!coords || coords.length < 2) return;

  let index = 0;
  let progress = 0;

  let lastDbUpdate = Date.now();

  const stepSpeed = 0.02;

  const interval = setInterval(async () => {
    try {

      const [start, end] = [coords[index], coords[index + 1]];
      if (!start || !end) {
        clearInterval(interval);
        return;
      }

      progress += stepSpeed;

      if (progress >= 1) {
        progress = 0;
        index++;

        if (index >= coords.length - 1) {
          await Ride.findByIdAndUpdate(rideId, {
            status: "COMPLETED"
          });

          clearInterval(interval);
          io.emit("ride-completed", { rideId });
          return;
        }
      }

      const lng = interpolate(start[0], end[0], progress);
      const lat = interpolate(start[1], end[1], progress);

      const now = Date.now();

      // 🔥 ONLY WRITE TO DB EVERY 1 SECOND
      if (now - lastDbUpdate > 1000) {
        const ride = await Ride.findById(rideId);

        if (ride?.driverId) {
          await Driver.findByIdAndUpdate(ride.driverId, {
            location: { lat, lng }
          });
        }

        lastDbUpdate = now;
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
  }, 80);
}

module.exports = { startDriverMovement };
