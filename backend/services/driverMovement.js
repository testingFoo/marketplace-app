const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

// ================= RANDOM START =================
function randomNear(coord) {
  const offset = () => (Math.random() - 0.5) * 0.03;

  return {
    lat: coord.lat + offset(),
    lng: coord.lng + offset()
  };
}

function interpolate(a, b, t) {
  return a + (b - a) * t;
}

// ================= MAIN DRIVER SIM =================
function startDriverMovement(io, rideId, routeCoords) {
  if (!routeCoords || routeCoords.length < 2) {
    console.log("❌ No routeCoords");
    return;
  }

  let index = 0;
  let progress = 0;
  let lastDbUpdate = Date.now();
  const stepSpeed = 0.02;
  let phase = "TO_PICKUP";

  let current = randomNear({
    lat: routeCoords[0][1],
    lng: routeCoords[0][0]
  });

  const interval = setInterval(async () => {
    try {
      const ride = await Ride.findById(rideId);
      if (!ride) return clearInterval(interval);

      let target;

      // ================= TO PICKUP =================
      if (phase === "TO_PICKUP") {
        target = {
          lat: routeCoords[0][1],
          lng: routeCoords[0][0]
        };

        current.lat = interpolate(current.lat, target.lat, stepSpeed);
        current.lng = interpolate(current.lng, target.lng, stepSpeed);

        const dist =
          Math.abs(current.lat - target.lat) +
          Math.abs(current.lng - target.lng);

        if (dist < 0.0003) {
          ride.status = "IN_PROGRESS";
          await ride.save();

          io.emit("ride:update", ride);

          phase = "TRIP";
          index = 0;
          progress = 0;
        }
      }

      // ================= TRIP =================
      else {
        const start = routeCoords[index];
        const end = routeCoords[index + 1];

        if (!start || !end) {
          ride.status = "COMPLETED";
          await ride.save();

          io.emit("ride-completed", { rideId });
          clearInterval(interval);
          return;
        }

        progress += stepSpeed;

        if (progress >= 1) {
          progress = 0;
          index++;
        }

        current.lng = interpolate(start[0], end[0], progress);
        current.lat = interpolate(start[1], end[1], progress);
      }

      // ================= DB UPDATE =================
      if (Date.now() - lastDbUpdate > 1000 && ride.driverId) {
        await Driver.findByIdAndUpdate(ride.driverId, {
          location: current
        });

        lastDbUpdate = Date.now();
      }

      // ================= SOCKET =================
      const etaSeconds = Math.round((routeCoords.length - index) * 15);

      io.emit("driver-location-update", {
        rideId,
        location: current,
        etaSeconds,
        phase
      });

    } catch (err) {
      console.log("❌ Movement error:", err);
      clearInterval(interval);
    }
  }, 1000);
}

module.exports = { startDriverMovement };
