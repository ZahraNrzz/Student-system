const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Student' },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['در حال بررسی', 'در حال انجام', 'اتمام'],
    default: 'در حال بررسی'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);
