import { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { API } from "../api/api";

import MapView from "../components/MapView";
import RideForm from "../components/RideForm";
import RideList from "../components/RideList";

export default function PassengerApp() {
  const [rides, setRides] = useState([]);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [tab, setTab] = useState("passenger");

  useEffect(() => {
    loadRides();

    socket.on("ride:new", loadRides);
    socket.on("ride:update", loadRides);
  }, []);

  async function loadRides() {
    const res = await fetch(`${API}/api/rides`);
    const data = await res.json();
    setRides(data);
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      <div style={{ width: 400, background: "#111", color: "white" }}>
        <h2>Passenger</h2>

        <button onClick={() => setTab("passenger")}>Passenger</button>
        <button onClick={() => setTab("parcel")}>Parcel</button>
        <button onClick={() => setTab("freight")}>Freight</button>

        <RideForm
          origin={origin}
          destination={destination}
          tab={tab}
          reload={loadRides}
        />

        <RideList rides={rides} />
      </div>

      <MapView
        setOrigin={setOrigin}
        setDestination={setDestination}
      />
    </div>
  );
}
