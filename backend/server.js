const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: { origin: "*" }
});

let rides = [];

// ================= SOCKET =================
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// ================= ROUTES =================
app.get("/api/rides", (req, res) => {
  res.json(rides);
});

app.post("/api/ride", (req, res) => {
  const ride = {
    _id: Date.now().toString(),
    ...req.body,
    status: "REQUESTED",
    fare: Math.floor(Math.random() * 30) + 10
  };

  rides.push(ride);

  io.emit("ride:new", ride);

  res.json(ride);
});

app.patch("/api/ride/:id/accept", (req, res) => {
  const ride = rides.find(r => r._id === req.params.id);

  if (ride) {
    ride.status = "ACCEPTED";
    ride.driverId = req.body.driverId;

    io.emit("ride:update", ride);
  }

  res.json(ride);
});

app.patch("/api/ride/:id/status", (req, res) => {
  const ride = rides.find(r => r._id === req.params.id);

  if (ride) {
    ride.status = req.body.status;
    io.emit("ride:update", ride);
  }

  res.json(ride);
});

// ================= START =================
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("Server running on", PORT);
});
