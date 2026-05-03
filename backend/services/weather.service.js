const Event = require("../models/Event");

async function fetchWeatherAndCreateEvents() {
  try {
    // Example: Warsaw
    const lat = 52.2297;
    const lng = 21.0122;

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
    );

    const data = await res.json();

    const weather = data.current_weather;

    const event = await Event.create({
      type: "weather",
      severity: weather.windspeed > 20 ? 4 : 2,
      location: { lat, lng },
      data: {
        temperature: weather.temperature,
        windspeed: weather.windspeed,
        condition: "live-weather"
      },
      source: "api"
    });

    return event;
  } catch (err) {
    console.log("Weather ingestion error:", err);
  }
}

module.exports = { fetchWeatherAndCreateEvents };
