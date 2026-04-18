
const Load = require("../models/Load");

// CREATE LOAD (SHIPPER)
exports.createLoad = async (req, res) => {
  const load = await Load.create(req.body);
  res.json(load);
};

// GET LOADBOARD
exports.getLoads = async (req, res) => {
  const loads = await Load.find();
  res.json(loads);
};

// ACCEPT LOAD
exports.acceptLoad = async (req, res) => {
  const load = await Load.findById(req.params.id);

  load.status = "BOOKED";
  load.driverId = req.body.driverId;

  await load.save();

  res.json(load);
};
