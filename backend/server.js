const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();

const rideRoutes = require("./routes/ride.routes");
const authRoutes = require("./routes/auth.routes");
const driverRoutes = require("./routes/driver.routes");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// ================= SOCKET =================
const io = new Server(server, {
  cors: { origin: "*" }
});

require("./sockets")(io);

// ================= DB =================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/drivers", driverRoutes);

// ================= START =================
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log("Stealth backend running on", PORT);
});
