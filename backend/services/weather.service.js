const Event = require("../models/Event");

async function fetchWeatherAndCreateEvents({ lat, lng }) {
  if (!lat || !lng) {
    throw new Error("Missing lat/lng");
  }

  const r = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${process.env.OPENWEATHER_KEY}`
  );

  const data = await r.json();

  const event = await Event.create({
    type: "weather",
    severity: data.main.temp > 30 ? 3 : 1,
    location: {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    },
    data: {
      temp: data.main.temp,
      wind: data.wind?.speed,
      description: data.weather?.[0]?.main
    },
    source: "api"
  });

  return event;
}

module.exports = { fetchWeatherAndCreateEvents };
