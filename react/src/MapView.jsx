import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ setOrigin, setDestination }) {
  useEffect(() => {
    const map = L.map("map").setView([50.06, 19.94], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OSM"
    }).addTo(map);

    let clickCount = 0;

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;

      L.marker([lat, lng]).addTo(map);

      if (clickCount === 0) {
        setOrigin({ lat, lng });
      } else {
        setDestination({ lat, lng });
      }

      clickCount++;
    });

    return () => map.remove();
  }, []);

  return <div id="map" style={{ flex: 1 }} />;
}
