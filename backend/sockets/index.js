const Driver = require("../models/Driver");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // ================= DRIVER STATUS =================
    socket.on("driver:status", async ({ driverId, status }) => {
      try {
        console.log("Driver status:", driverId, status);

        await Driver.findByIdAndUpdate(driverId, {
          status,
          available: status === "IDLE"
        });

      } catch (err) {
        console.log("Driver status error:", err);
      }
    });

    // ================= DRIVER LOCATION (REAL-TIME) =================
    socket.on("driver:location", async ({ driverId, location }) => {
      try {
        await Driver.findByIdAndUpdate(driverId, {
          location
        });

        // broadcast to all clients (passenger map etc.)
        io.emit("driver-location-update", {
          driverId,
          location
        });

      } catch (err) {
        console.log("Driver location error:", err);
      }
    });

    // ================= OPTIONAL: LEGACY SUPPORT =================
    socket.on("driver:location:update", (data) => {
      io.emit("driver-location-update", data);
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};
