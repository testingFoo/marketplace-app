const router = require("express").Router(); 
const User = require("../models/User"); 
const auth = require("../middleware/auth.middleware"); 

// ================= GET MY PROFILE =================
router.get("/me", auth, async (req, res) => { 
  try { 
    const user = await User.findById(req.user.id)
      .populate(
        "receivedRequests", 
        "firstName lastName currentCity country"
      )
      .populate(
        "connections", 
        "firstName lastName"
      )
      .select("-password"); 

    return res.json({ user }); 
  } catch (err) { 
    console.log(err); 
    return res.status(500).json({ error: "Failed to load profile" }); 
  } 
}); 

// ================= UPDATE PROFILE =================
router.put("/update", auth, async (req, res) => { 
  try { 
    console.log("USER:", req.user); 
    console.log("BODY:", req.body); 

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

    return res.json({ user: updated }); 
  } catch (err) { 
    console.log("UPDATE ERROR:", err); 
    return res.status(500).json({ error: "Update failed" }); 
  } 
}); 

// ================= SEND CONNECTION REQUEST =================
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

    // already connected
    if (fromUser.connections.includes(to)) { 
      return res.status(400).json({ error: "Already connected" }); 
    } 

    // already requested
    if (fromUser.sentRequests.includes(to)) { 
      return res.status(400).json({ error: "Already sent" }); 
    } 

    fromUser.sentRequests.push(to); 
    toUser.receivedRequests.push(from); 

    await fromUser.save(); 
    await toUser.save(); 

    return res.json({ success: true }); 
  } catch (err) { 
    console.log(err); 
    return res.status(500).json({ error: "Request failed" }); 
  } 
}); 

// ================= ACCEPT CONNECTION =================
router.post("/accept/:id", auth, async (req, res) => { 
  try { 
    const me = await User.findById(req.user.id); 
    const other = await User.findById(req.params.id); 

    if (!other) { 
      return res.status(404).json({ error: "User not found" }); 
    } 

    // remove pending request
    me.receivedRequests = me.receivedRequests.filter(
      (id) => id.toString() !== req.params.id
    ); 

    other.sentRequests = other.sentRequests.filter(
      (id) => id.toString() !== req.user.id
    ); 

    // add connection
    if (!me.connections.includes(req.params.id)) { 
      me.connections.push(req.params.id); 
    } 

    if (!other.connections.includes(req.user.id)) { 
      other.connections.push(req.user.id); 
    } 

    await me.save(); 
    await other.save(); 

    return res.json({ success: true }); 
  } catch (err) { 
    console.log(err); 
    return res.status(500).json({ error: "Accept failed" }); 
  } 
}); 

// ================= PUBLIC USER PROFILE =================
router.get("/:id", async (req, res) => { 
  try { 
    const user = await User.findById(req.params.id).select(
      "firstName lastName sex dob bornCity currentCity country hasBusiness businessName interests connections profilePicture createdAt"
    ); 

    if (!user) { 
      return res.status(404).json({ error: "User not found" }); 
    } 

    return res.json({ user }); 
  } catch (err) { 
    console.log(err); 
    return res.status(500).json({ error: "Failed to load user" }); 
  } 
}); 

module.exports = router;
