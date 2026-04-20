import { useEffect, useState } from "react";
import { API } from "../api/api";
import { socket } from "../socket/socket";

export default function DriverApp() {
  const [rides, setRides] = useState([]);
  const driverId = "D-" + Math.floor(Math.random() * 99999);

  useEffect(() => {
    loadJobs();

    socket.on("ride:new", loadJobs);
    socket.on("ride:update", loadJobs);
  }, []);

  async function loadJobs() {
    const res = await fetch(`${API}/api/rides`);
    const data = await res.json();
    setRides(data);
  }

  async function acceptRide(id) {
    await fetch(`${API}/api/rides/${id}/accept`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId })
    });

    loadJobs();
  }

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: 400, background: "#111", color: "white" }}>
        <h2>Driver Panel</h2>

        {rides
          .filter(r => r.status === "REQUESTED")
          .map(r => (
            <div key={r._id} style={{ margin: 10 }}>
              <b>{r.type}</b>
              <button onClick={() => acceptRide(r._id)}>
                Accept
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
