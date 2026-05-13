const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth.middleware");

// GET ME
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("connections", "firstName lastName")
    .populate("receivedRequests", "firstName lastName");

  res.json({ user });
});

// UPDATE
router.put("/update", auth, async (req, res) => {
  const updated = await User.findByIdAndUpdate(
    req.user._id,
    req.body,
    { new: true }
  );

  res.json({ user: updated });
});

// CONNECT
router.post("/connect/:id", auth, async (req, res) => {
  const me = await User.findById(req.user._id);
  const other = await User.findById(req.params.id);

  if (!other) return res.status(404).json({ error: "not found" });

  if (!me.sentRequests.includes(other._id)) {
    me.sentRequests.push(other._id);
    other.receivedRequests.push(me._id);
  }

  await me.save();
  await other.save();

  res.json({ success: true });
});

// ACCEPT
router.post("/accept/:id", auth, async (req, res) => {
  const me = await User.findById(req.user._id);
  const other = await User.findById(req.params.id);

  me.receivedRequests = me.receivedRequests.filter(
    (x) => x.toString() !== req.params.id
  );

  other.sentRequests = other.sentRequests.filter(
    (x) => x.toString() !== req.user._id.toString()
  );

  me.connections.push(other._id);
  other.connections.push(me._id);

  await me.save();
  await other.save();

  res.json({ success: true });
});

module.exports = router;
