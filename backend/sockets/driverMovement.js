const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

// ================= RANDOM START NEAR PICKUP =================
function randomNear(coord) {
  const offset = () => (Math.random() - 0.5) * 0.02; // ~1–2 km radius

  return {
    lat: coord.lat + offset(),
    lng: coord.lng + offset()
  };
}

// ================= INTERPOLATION =================
function interpolate(a, b, t) {
  return a + (b - a) * t;
}

// ================= MAIN MOVEMENT =================
async function startDriverMovement(io, rideId, coords) {
  if (!coords || coords.length < 2) return;

  const ride = await Ride.findById(rideId);
  if (!ride) return;

  let driver = null;

  if (ride.driverId) {
    driver = await Driver.findById(ride.driverId);
  }

  // 🔥 FIX: ensure driver has starting location
  if (!driver?.location) {
    const start = randomNear(ride.originCoords);

    if (driver) {
      await Driver.findByIdAndUpdate(driver._id, {
        location: start
      });
    }

    // inject starting point into route
    coords.unshift([start.lng, start.lat]);
  }

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

        // 🔥 ARRIVED AT PICKUP
        if (index === 1) {
          await Ride.findByIdAndUpdate(rideId, {
           status: "DRIVER_ARRIVED"
          });

          io.emit("ride:update", {
            _id: rideId,
            status: "IN_PROGRESS"
          });
        }

        // 🔥 FINISHED RIDE
        if (index >= coords.length - 1) {
          await Ride.findByIdAndUpdate(rideId, {
            status: "COMPLETED"
          });

          if (driver) {
            await Driver.findByIdAndUpdate(driver._id, {
              available: true,
              status: "IDLE"
            });
          }

          io.emit("ride-completed", { rideId });

          clearInterval(interval);
          return;
        }
      }

      const lng = interpolate(start[0], end[0], progress);
      const lat = interpolate(start[1], end[1], progress);

      const now = Date.now();

      // 🔥 reduce Mongo spam
      if (now - lastDbUpdate > 1000 && driver) {
        await Driver.findByIdAndUpdate(driver._id, {
          location: { lat, lng }
        });

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
