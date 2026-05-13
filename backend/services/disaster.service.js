const Event = require("../models/Event"); 

// NASA EONET
async function fetchEONETEvents() { 
  const res = await fetch("https://eonet.gsfc.nasa.gov/api/v3/events"); 
  const text = await res.text(); 

  let data; 
  try { 
    data = JSON.parse(text); 
  } catch (err) { 
    console.log("NASA INVALID RESPONSE:"); 
    console.log(text); 
    return []; 
  } 

  return data.events.map((e) => ({ 
    type: "disaster", 
    severity: 3, 
    location: { 
      lat: e.geometry?.[0]?.coordinates[1], 
      lng: e.geometry?.[0]?.coordinates[0] 
    }, 
    data: { 
      title: e.title, 
      category: e.categories?.[0]?.title 
    }, 
    source: "nasa" 
  })); 
} 

// USGS earthquakes
async function fetchEarthquakes() { 
  const res = await fetch(
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
  ); 

  const data = await res.json(); 

  return data.features.map((f) => ({ 
    type: "disaster", 
    severity: f.properties.mag > 5 ? 4 : 2, 
    location: { 
      lat: f.geometry.coordinates[1], 
      lng: f.geometry.coordinates[0] 
    }, 
    data: { 
      title: f.properties.place, 
      magnitude: f.properties.mag 
    }, 
    source: "usgs" 
  })); 
} 

// MAIN
async function generateDisasterEvents() { 
  const eonet = await fetchEONETEvents(); 
  const quakes = await fetchEarthquakes(); 

  const events = [...eonet, ...quakes]; 

  // save few (avoid spam)
  const saved = []; 

  for (let e of events.slice(0, 10)) { 
    const event = await Event.create(e); 
    saved.push(event); 
  } 

  return saved; 
} 

module.exports = { generateDisasterEvents };
