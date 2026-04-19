const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const rideRoutes = require("./routes/ride.routes");
const authRoutes = require("./routes/auth.routes");
const driverRoutes = require("./routes/driver.routes");

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/api/ride", rideRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/driver", driverRoutes);

// http server for socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.set("io", io);

// socket connection
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// DB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("🟢 Mongo connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
