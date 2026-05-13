const Event = require("../models/Event"); 

async function generateTrafficEvent({ lat, lng }) { 
  if (!lat || !lng) { 
    throw new Error("Missing lat/lng"); 
  } 

  // simple simulation (replace later with real API)
  const severity = Math.random() > 0.7 ? 3 : 1; 

  const event = await Event.create({ 
    type: "traffic", 
    severity, 
    location: { 
      lat: parseFloat(lat), 
      lng: parseFloat(lng) 
    }, 
    data: { 
      status: severity > 2 ? "Heavy traffic" : "Normal traffic" 
    }, 
    source: "system" 
  }); 

  return event; 
} 

module.exports = { generateTrafficEvent };
