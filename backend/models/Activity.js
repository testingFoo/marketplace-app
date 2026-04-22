
const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  type: String, 
  // examples:
  // "RIDE_BOOKED"
  // "PAYMENT"
  // "BUSINESS_FOLLOW"
  // "MEETING"

  metadata: Object,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Activity", ActivitySchema);
