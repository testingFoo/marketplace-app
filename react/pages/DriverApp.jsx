import { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { API } from "../api/api";

import DriverJobs from "../components/DriverJobs";

export default function DriverApp() {
  const [rides, setRides] = useState([]);

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

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: 400, background: "#111", color: "white" }}>
        <h2>Driver Panel</h2>

        <DriverJobs rides={rides} reload={loadJobs} />
      </div>
    </div>
  );
}
