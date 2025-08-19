// routes/profileRoutes.js
const express = require('express');
const multer = require('multer');
const Student = require('../models/Student');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper: get username from cookies
const getUsernameFromCookies = (req) => req.cookies.username || null;

// Get Profile
router.get('/GetProfile', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const user = await Student.findOne({ username: currentUsername });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      username: user.username,
      email: user.email,
      password: user.password,
      avatarBase64: user.avatarBase64 || null
    });
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت پروفایل', error: err.message });
  }
});

// Update Profile
router.post('/UpdateProfile', upload.single('avatar'), async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const updateData = {
      ...(req.body?.username && { username: req.body.username }),
      ...(req.body?.email && { email: req.body.email }),
      ...(req.body?.password && { password: req.body.password }),
      ...(req.file && { avatarBase64: req.file.buffer.toString('base64') })
    };

    await Student.updateOne({ username: currentUsername }, { $set: updateData });
    res.json({ message: 'اطلاعات با موفقیت ذخیره شد', avatarBase64: updateData.avatarBase64 || null });
  } catch (err) {
    res.status(500).json({ message: 'خطا در بروزرسانی پروفایل', error: err.message });
  }
});

// Signup
router.post('/Signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await Student.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ message: 'نام کاربری یا ایمیل موجود است' });

    const newUser = new Student({ username, email, password });
    await newUser.save();
    res.status(201).json({ message: 'ثبت‌نام موفقیت‌آمیز بود!' });
  } catch (err) {
    res.status(500).json({ message: 'ثبت‌نام ناموفق بود', error: err.message });
  }
});

// Login
router.post('/Login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Student.findOne({ username, password });
    if (!user) return res.status(401).json({ message: 'نام کاربری یا رمز اشتباه است' });

    res.cookie('username', user.username, { httpOnly: true });
    res.json({ message: 'ورود موفقیت‌آمیز بود', username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ورود', error: err.message });
  }
});

module.exports = router;