// routes/financeRoutes.js
const express = require('express');
const Student = require('../models/Student');
const Finance = require('../models/Finance');
const PaymentsFinance = require('../models/PaymentsFinance');

const router = express.Router();

// Helper
const getUsernameFromCookies = (req) => req.cookies.username || null;

// Recharge Balance
router.post('/RechargeBalance', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const user = await Student.findOne({ username: currentUsername });
    const { amount } = req.body;

    let finance = await Finance.findOne({ userId: user._id });
    if (!finance) finance = new Finance({ userId: user._id, balance: 0 });

    finance.balance += Number(amount);
    await finance.save();

    res.json({ message: 'موجودی افزایش یافت', balance: finance.balance });
  } catch (err) {
    res.status(500).json({ message: 'خطا در افزایش موجودی', error: err.message });
  }
});

// Pay Tuition
router.post('/PayTuition', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const { amount, term } = req.body;
    const user = await Student.findOne({ username: currentUsername });

    const payment = new PaymentsFinance({
      userId: user._id,
      amount: Number(amount),
      term: term || '1403-2'
    });

    await payment.save();
    res.json({ message: 'پرداخت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ثبت پرداخت', error: err.message });
  }
});

// Get Tuition Status
router.get('/GetTuitionStatus', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const term = req.query.term || '1403-2';
    const user = await Student.findOne({ username: currentUsername });
    const tuition = 2000000;

    const payments = await PaymentsFinance.find({ userId: user._id, term }).sort({ date: 1 });
    let totalPaidSoFar = 0;
    const enrichedPayments = payments.map(p => {
      totalPaidSoFar += p.amount;
      return {
        _id: p._id,
        amount: p.amount,
        date: p.date,
        term: p.term,
        totalPaidUpToThisPayment: totalPaidSoFar,
        remaining: tuition - totalPaidSoFar
      };
    });

    res.json({
      tuition,
      totalPaid: totalPaidSoFar,
      remaining: tuition - totalPaidSoFar,
      payments: enrichedPayments
    });
  } catch (err) {
    res.status(500).json({ message: 'خطا در واکشی اطلاعات مالی', error: err.message });
  }
});

module.exports = router;
