const Event = require("../models/Event");

const cache = new Map();
const TTL = 1000 * 60 * 5;

function key(lat, lng) {
  return `${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}`;
}

function get(k) {
  const v = cache.get(k);
  if (!v) return null;
  if (Date.now() > v.expiry) {
    cache.delete(k);
    return null;
  }
  return v.data;
}

function set(k, data) {
  cache.set(k, {
    data,
    expiry: Date.now() + TTL
  });
}

// CREATE EVENT VERSION
async function fetchWeatherAndCreateEvents({ lat, lng }) {
  if (!lat || !lng) throw new Error("Missing lat/lng");

  const r = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${process.env.OPENWEATHER_KEY}`
  );

  if (!r.ok) {
    throw new Error(`Weather API error ${r.status}`);
  }

  const data = await r.json();

  const event = await Event.create({
    type: "weather",
    severity: data.main.temp > 30 ? 3 : 1,
    location: { lat: +lat, lng: +lng },
    data: {
      temp: data.main.temp,
      wind: data.wind?.speed,
      description: data.weather?.[0]?.main
    },
    source: "openweather"
  });

  return event;
}

// LIVE VERSION
async function fetchWeatherLive({ lat, lng }) {
  if (!lat || !lng) throw new Error("Missing lat/lng");

  const k = key(lat, lng);

  const cached = get(k);
  if (cached) return cached;

  const r = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${process.env.OPENWEATHER_KEY}`
  );

  if (!r.ok) {
    throw new Error(`Weather API error ${r.status}`);
  }

  const data = await r.json();

  const result = {
    temp: data.main.temp,
    wind: data.wind?.speed,
    description: data.weather?.[0]?.main
  };

  set(k, result);

  return result;
}

module.exports = {
  fetchWeatherAndCreateEvents,
  fetchWeatherLive
};
