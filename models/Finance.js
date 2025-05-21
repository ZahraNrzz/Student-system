const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  balance: { type: Number, default: 0 },
});

module.exports = mongoose.model('Finance', financeSchema);
