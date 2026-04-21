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

      // 🔥 update driver location
      if (ride.driverId) {
        await Driver.findByIdAndUpdate(ride.driverId, {
          location: { lat, lng }
        });
      }

      // ETA
      const remainingRatio = (total - index) / total;
      const etaSeconds = Math.round(remainingRatio * 300);

      // 🔥 NEW: movement phase detection
      let phase = "EN_ROUTE";

      if (index < total * 0.5) {
        phase = "TO_PICKUP";
      } else {
        phase = "TO_DESTINATION";
      }

      io.emit("driver-location-update", {
        rideId,
        location: { lat, lng },
        progress: index / total,
        etaSeconds,
        phase
      });

      index++;

      // ================= END OF ROUTE =================
      if (index >= total) {
        clearInterval(interval);

        await Ride.findByIdAndUpdate(rideId, {
          status: "COMPLETED"
        });

        // free driver
        if (ride.driverId) {
          await Driver.findByIdAndUpdate(ride.driverId, {
            status: "IDLE",
            available: true
          });
        }

        io.emit("ride-completed", { rideId });
      }

    } catch (err) {
      console.log("Movement error:", err);
      clearInterval(interval);
    }

  }, 300);
}

module.exports = { startDriverMovement };
