export default function RideList({ rides }) {
  return (
    <div>
      {rides.map(r => (
        <div key={r._id} style={{ padding: 10, borderBottom: "1px solid gray" }}>
          <b>{r.type}</b><br />
          Status: {r.status}<br />
          Fare: ${r.fare || 0}
        </div>
      ))}
    </div>
  );
}
