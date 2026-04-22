const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

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

function startDriverMovement(io, rideId, routeCoords) {
  if (!routeCoords || routeCoords.length < 2) return;

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

      // ================= TO PICKUP =================
      if (phase === "TO_PICKUP") {
        const target = {
          lat: routeCoords[0][1],
          lng: routeCoords[0][0]
        };

        current.lat = interpolate(current.lat, target.lat, stepSpeed);
        current.lng = interpolate(current.lng, target.lng, stepSpeed);

        const dist =
          Math.abs(current.lat - target.lat) +
          Math.abs(current.lng - target.lng);

        // 🚨 ARRIVED AT PICKUP
        if (dist < 0.0003) {
          ride.status = "WAITING_START"; // 👈 IMPORTANT CHANGE
          await ride.save();

          io.emit("ride:update", ride);

          clearInterval(interval); // ⛔ STOP MOVEMENT UNTIL DRIVER STARTS
          return;
        }
      }

      // ================= TRIP PHASE (not used until restart) =================
      const start = routeCoords[index];
      const end = routeCoords[index + 1];

      if (!start || !end) {
        await Ride.findByIdAndUpdate(rideId, {
          status: "COMPLETED"
        });

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

      const now = Date.now();

      if (now - lastDbUpdate > 1000 && ride.driverId) {
        await Driver.findByIdAndUpdate(ride.driverId, {
          location: current
        });

        lastDbUpdate = now;
      }

      io.emit("driver-location-update", {
        rideId,
        location: current,
        etaSeconds: Math.round((routeCoords.length - index) * 10),
        phase
      });

    } catch (err) {
      console.log("Movement error:", err);
      clearInterval(interval);
    }
  }, 80);
}

module.exports = { startDriverMovement };
