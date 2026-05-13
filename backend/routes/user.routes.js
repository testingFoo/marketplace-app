const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth.middleware");

// ================= MY PROFILE =================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("receivedRequests", "firstName lastName currentCity country")
      .populate("connections", "firstName lastName")
      .select("-password");

    res.json({ user });

  } catch (err) {
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// ================= UPDATE PROFILE =================
router.put("/update", auth, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        sex: req.body.sex,
        dob: req.body.dob,
        bornCity: req.body.bornCity,
        currentCity: req.body.currentCity,
        country: req.body.country,
        hasBusiness: req.body.hasBusiness,
        businessName: req.body.businessName,
        interests: req.body.interests
      },
      { new: true }
    ).select("-password");

    res.json({ user: updated });

  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// ================= CONNECT =================
router.post("/connect/:id", auth, async (req, res) => {
  try {
    const from = req.user.id;
    const to = req.params.id;

    if (from === to) {
      return res.status(400).json({ error: "Cannot connect to self" });
    }

    const fromUser = await User.findById(from);
    const toUser = await User.findById(to);

    if (!toUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (fromUser.connections.includes(to)) {
      return res.status(400).json({ error: "Already connected" });
    }

    if (fromUser.sentRequests.includes(to)) {
      return res.status(400).json({ error: "Already sent" });
    }

    fromUser.sentRequests.push(to);
    toUser.receivedRequests.push(from);

    await fromUser.save();
    await toUser.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Request failed" });
  }
});

// ================= ACCEPT =================
router.post("/accept/:id", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const other = await User.findById(req.params.id);

    if (!other) {
      return res.status(404).json({ error: "User not found" });
    }

    me.receivedRequests = me.receivedRequests.filter(
      id => id.toString() !== req.params.id
    );

    other.sentRequests = other.sentRequests.filter(
      id => id.toString() !== req.user.id
    );

    if (!me.connections.includes(req.params.id)) {
      me.connections.push(req.params.id);
    }

    if (!other.connections.includes(req.user.id)) {
      other.connections.push(req.user.id);
    }

    await me.save();
    await other.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Accept failed" });
  }
});

// ================= PUBLIC PROFILE (FIXED + SAFE) =================
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select(`
        firstName
        lastName
        sex
        dob
        bornCity
        currentCity
        country
        hasBusiness
        businessName
        interests
        connections
        profileImage
        createdAt
      `);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });

  } catch (err) {
    res.status(500).json({ error: "Failed to load user" });
  }
});

module.exports = router;
