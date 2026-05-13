const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const Wallet = require("../models/Wallet");

// GET WALLET
router.get("/", auth, async (req, res) => {
  let wallet = await Wallet.findOne({ userId: req.user._id });

  if (!wallet) {
    wallet = await Wallet.create({ userId: req.user._id });
  }

  res.json(wallet);
});

// ADD MONEY (SIMULATION)
router.post("/add", auth, async (req, res) => {
  const { amount } = req.body;

  let wallet = await Wallet.findOne({ userId: req.user._id });

  if (!wallet) {
    wallet = await Wallet.create({ userId: req.user._id });
  }

  wallet.balance += amount;

  wallet.transactions.push({
    type: "deposit",
    amount
  });

  await wallet.save();

  res.json(wallet);
});

module.exports = router;
