const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: String, required: true },
  food: {
    name: String,
    image: String,
    price: Number,
  },
  restaurant: String,
});

module.exports = mongoose.model('Reservation', reservationSchema);
