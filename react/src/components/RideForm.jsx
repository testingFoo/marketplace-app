import { API } from "../api/api";

export default function RideForm({ origin, destination, tab, reload }) {

  async function submitRide() {
    if (!origin || !destination) {
      alert("Select origin and destination on map");
      return;
    }

    const res = await fetch(`${API}/api/rides`, {
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

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    reload();
  }

  return (
    <div>
      <button onClick={submitRide}>Submit Ride</button>
    </div>
  );
}
