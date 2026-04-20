import PassengerApp from "./pages/PassengerApp";
import DriverApp from "./pages/DriverApp";

export default function App() {
  // switch here manually for now
  const mode = "passenger"; // change to "driver"

  return mode === "passenger" ? <PassengerApp /> : <DriverApp />;
}
