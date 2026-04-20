const MAPBOX_TOKEN =
  "pk.eyJ1IjoibWFwZnVycWFuIiwiYSI6ImNtbzRoMGdnbjEzZXkydnF3MWFhN2t5aWcifQ.A7GlM3WDlLWHBl6lQCHKEA";

export async function getRoute(origin, destination) {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
      `?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || !data.routes.length) return null;

    return data.routes[0].geometry.coordinates; // [lng, lat]
  } catch (err) {
    console.log("Mapbox route error:", err);
    return null;
  }
}
