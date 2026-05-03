const Event = require("../models/Event");

async function fetchWeatherAndCreateEvents({ lat, lng }) {
  try {
    // fallback to Warsaw if none provided
    const safeLat = lat || 52.2297;
    const safeLng = lng || 21.0122;

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${safeLat}&longitude=${safeLng}&current_weather=true`
    );

    const data = await res.json();
    const weather = data.current_weather;

    const event = await Event.create({
      type: "weather",
      severity: weather.windspeed > 20 ? 4 : 2,
      location: {
        lat: safeLat,
        lng: safeLng
      },
      data: {
        temperature: weather.temperature,
        windspeed: weather.windspeed,
        winddirection: weather.winddirection
      },
      source: "api"
    });

    return event;
  } catch (err) {
    console.log("Weather service error:", err);
  }
}

module.exports = { fetchWeatherAndCreateEvents };
