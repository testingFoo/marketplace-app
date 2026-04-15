const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// test route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// create ride (fake Uber logic)
app.post("/api/ride", (req, res) => {
  const { pickup, destination } = req.body;

  const ride = {
    id: Math.floor(Math.random() * 10000),
    pickup,
    destination,
    status: "driver searching..."
  };

  res.json(ride);
});

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
