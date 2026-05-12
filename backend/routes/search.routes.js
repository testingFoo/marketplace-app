const router = require("express").Router();
const User = require("../models/User");

// ================= GLOBAL SEARCH =================
router.get("/all", async (req, res) => {
  try {
    const q = req.query.q || "";

    if (!q) {
      return res.json({
        users: [],
        businesses: [],
        cities: []
      });
    }

    const regex = new RegExp(q, "i");

    // ================= USERS =================
    const users = await User.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { currentCity: regex },
        { country: regex },
        { bornCity: regex }
      ]
    }).select("firstName lastName currentCity country businessName hasBusiness interests");

    // ================= BUSINESSES =================
    const businesses = await User.find({
      hasBusiness: true,
      businessName: regex
    }).select("businessName currentCity country firstName lastName");

    // ================= CITIES (from users) =================
    const cityAgg = await User.aggregate([
      {
        $match: {
          currentCity: regex
        }
      },
      {
        $group: {
          _id: "$currentCity",
          country: { $first: "$country" }
        }
      },
      {
        $limit: 10
      }
    ]);

    const cities = cityAgg.map((c) => ({
      city: c._id,
      country: c.country
    }));

    return res.json({
      users,
      businesses,
      cities
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
