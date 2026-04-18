const router = require("express").Router();
const ctrl = require("../controllers/load.controller");

router.get("/", ctrl.getLoads);
router.post("/", ctrl.createLoad);
router.patch("/:id/accept", ctrl.acceptLoad);

module.exports = router;
