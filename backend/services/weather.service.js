const Event = require("../models/Event");

// ================= SIMPLE IN-MEMORY CACHE =================
const cache = new Map();
const TTL = 1000 * 60 * 5; // 5 minutes

function getCacheKey(lat, lng) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    expiry: Date.now() + TTL
  });
}

// ================= EVENT VERSION (KEEP) =================
async function fetchWeatherAndCreateEvents({ lat, lng }) {
  if (!lat || !lng) {
    throw new Error("Missing lat/lng");
  }

  const r = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${process.env.OPENWEATHER_KEY}`
  );

  const data = await r.json();

  if (!data || !data.main) {
    throw new Error("Weather API failed: " + JSON.stringify(data));
  }

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

// ================= LIVE VERSION (NO DB + CACHE) =================
async function fetchWeatherLive({ lat, lng }) {
  if (!lat || !lng) {
    throw new Error("Missing lat/lng");
  }

  const key = getCacheKey(Number(lat), Number(lng));

  // ✅ CHECK CACHE
  const cached = getCached(key);
  if (cached) {
    return cached;
  }

  // ✅ FETCH API
  const r = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${process.env.OPENWEATHER_KEY}`
  );

  const data = await r.json();

  if (!data || !data.main) {
    throw new Error("Weather API failed: " + JSON.stringify(data));
  }

  const result = {
    temp: data.main.temp,
    wind: data.wind?.speed,
    description: data.weather?.[0]?.main
  };

  // ✅ STORE CACHE
  setCache(key, result);

  return result;
}

module.exports = {
  fetchWeatherAndCreateEvents,
  fetchWeatherLive
};
