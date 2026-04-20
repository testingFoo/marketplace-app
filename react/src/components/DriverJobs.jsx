import { API } from "../api/api";

export default function DriverJobs({ rides, reload }) {

  const driverId = "D-" + Math.floor(Math.random() * 99999);

  async function acceptRide(id) {
    await fetch(`${API}/api/rides/${id}/accept`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId })
    });

    reload();
  }

  return (
    <div>
      {rides
        .filter(r => r.status === "REQUESTED")
        .map(r => (
          <div key={r._id} style={{ margin: 10 }}>
            <b>{r.type}</b><br />
            <button onClick={() => acceptRide(r._id)}>
              Accept
            </button>
          </div>
        ))}
    </div>
  );
}
