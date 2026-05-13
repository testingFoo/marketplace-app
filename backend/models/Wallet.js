const mongoose = require("mongoose"); 

const WalletSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  balance: { 
    type: Number, 
    default: 10 // starting bonus 
  },
  currency: { 
    type: String, 
    default: "USD" 
  },
  transactions: [
    {
      type: { 
        type: String, // "ride", "purchase", "deposit", "withdraw" 
        required: true 
      },
      amount: Number,
      meta: Object,
      createdAt: { 
        type: Date, 
        default: Date.now 
      }
    }
  ]
});

module.exports = mongoose.model("Wallet", WalletSchema);
