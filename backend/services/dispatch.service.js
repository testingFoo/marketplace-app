const Driver = require("../models/Driver");

exports.findDriver = async (type) => {
  const drivers = await Driver.find({ available: true });

  return drivers.sort((a, b) => b.rating - a.rating)[0];
};
