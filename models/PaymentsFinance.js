const mongoose = require('mongoose');

const paymentsFinanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  term: { type: String, required: true }, 
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PaymentsFinance', paymentsFinanceSchema);
