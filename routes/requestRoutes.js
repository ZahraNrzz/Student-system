// routes/requestRoutes.js
const express = require('express');
const Student = require('../models/Student');
const Request = require('../models/Requests');

const router = express.Router();
const getUsernameFromCookies = (req) => req.cookies.username || null;

// Send Request
router.post('/SendRequest', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const user = await Student.findOne({ username: currentUsername });
    const { receiver, message } = req.body;

    const statuses = ['در حال بررسی', 'در حال انجام', 'اتمام'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const newRequest = new Request({
      userId: user._id,
      receiver,
      message,
      status: randomStatus,
      date: new Date()
    });

    await newRequest.save();
    res.status(201).json({ message: 'درخواست با موفقیت ثبت شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ثبت درخواست', error: err.message });
  }
});

// Get Requests
router.get('/GetRequests', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const user = await Student.findOne({ username: currentUsername });
    const requests = await Request.find({ userId: user._id }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت درخواست‌ها', error: err.message });
  }
});

module.exports = router;
