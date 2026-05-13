const router = require("express").Router(); 
const ctrl = require("../controllers/auth.controller"); 
const jwt = require("jsonwebtoken"); 
const User = require("../models/User"); 

// ================= REGISTER =================
router.post("/register", ctrl.register); 

// ================= LOGIN =================
router.post("/login", ctrl.login); 

// ================= ME =================
router.get("/me", async (req, res) => { 
  try { 
    const auth = req.headers.authorization; 
    
    if (!auth) { 
      return res.status(401).json({ user: null }); 
    } 
    
    const token = auth.split(" ")[1]; 
    const decoded = jwt.verify(token, "SECRET"); 
    const user = await User.findById(decoded.id); 
    
    return res.json({ user }); 
  } catch (err) { 
    return res.status(401).json({ user: null }); 
  } 
}); 

module.exports = router;
