import { useEffect, useState } from "react";
import { API } from "../api/api";
import { socket } from "../socket/socket";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

export default function PassengerApp() {
  const [rides, setRides] = useState([]);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [tab, setTab] = useState("passenger");

  useEffect(() => {
    initMap();
    loadRides();

    socket.on("ride:new", loadRides);
    socket.on("ride:update", loadRides);
  }, []);

  function initMap() {
    const map = L.map("map").setView([50.06, 19.94], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OSM"
    }).addTo(map);

    window._map = map;
  }

  async function submitRide() {
    if (!origin || !destination) return;

    await fetch(`${API}/api/rides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "demo-user",

        type:
          tab === "passenger"
            ? "UBERX"
            : tab === "parcel"
              ? "VAN"
              : "FREIGHT",

        originCoords: origin,
        destinationCoords: destination
      })
    });

    loadRides();
  }

  async function loadRides() {
    const res = await fetch(`${API}/api/rides`);
    const data = await res.json();
    setRides(data);
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      <div style={{ width: 400, background: "#111", color: "white" }}>
        <h2>STEALTH MARKET</h2>

        <button onClick={() => setTab("passenger")}>Passenger</button>
        <button onClick={() => setTab("parcel")}>Parcel</button>
        <button onClick={() => setTab("freight")}>Freight</button>

        <button onClick={submitRide}>Submit Ride</button>

        {rides.map(r => (
          <div key={r._id} style={{ padding: 10 }}>
            {r.type} → {r.status}
          </div>
        ))}
      </div>

      <div id="map" style={{ flex: 1 }} />
    </div>
  );
}
