const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

// 🔥 RANDOM START (within ~3km)
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

  // 🔥 start from random location
  let current = randomNear({
    lat: routeCoords[0][1],
    lng: routeCoords[0][0]
  });

  const interval = setInterval(async () => {
    try {
      const ride = await Ride.findById(rideId);
      if (!ride) return clearInterval(interval);

      // ================= PHASE SWITCH =================
      if (phase === "TO_PICKUP" && index >= 10) {
        ride.status = "IN_PROGRESS";
        await ride.save();

        io.emit("ride:update", ride);

        phase = "TRIP";
      }

      const start = routeCoords[index];
      const end = routeCoords[index + 1];

      if (!start || !end) {
        await Ride.findByIdAndUpdate(rideId, { status: "COMPLETED" });

        io.emit("ride-completed", { rideId });
        clearInterval(interval);
        return;
      }

      progress += stepSpeed;

      if (progress >= 1) {
        progress = 0;
        index++;
      }

      const lng = interpolate(start[0], end[0], progress);
      const lat = interpolate(start[1], end[1], progress);

      const now = Date.now();

      // 🔥 reduce DB spam
      if (now - lastDbUpdate > 1000 && ride.driverId) {
        await Driver.findByIdAndUpdate(ride.driverId, {
          location: { lat, lng }
        });

        lastDbUpdate = now;
      }

      const remainingRatio = (routeCoords.length - index) / routeCoords.length;
      const etaSeconds = Math.round(remainingRatio * 300);

      io.emit("driver-location-update", {
        rideId,
        location: { lat, lng },
        etaSeconds
      });

    } catch (err) {
      console.log("Movement error:", err);
      clearInterval(interval);
    }
  }, 80);
}

module.exports = { startDriverMovement };
