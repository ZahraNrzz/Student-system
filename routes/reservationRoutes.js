const express = require('express');
const multer = require('multer');
const Student = require('../models/Student');
const Reservation = require('../models/Reservation');
const Finance = require('../models/Finance');
const Food = require('../models/Foods');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const getUsernameFromCookies = (req) => req.cookies.username || null;

// Reserve Food
router.post('/ReserveFood', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const user = await Student.findOne({ username: currentUsername });
    const { date, food, restaurant } = req.body;

    const finance = await Finance.findOne({ userId: user._id });
    if (!finance || finance.balance < food.price)
      return res.status(400).json({ message: 'موجودی کافی نیست!' });

    finance.balance -= food.price;
    await finance.save();

    const newReservation = new Reservation({ userId: user._id, date, food, restaurant });
    await newReservation.save();

    res.status(201).json({ message: 'رزرو با موفقیت انجام شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در رزرو غذا', error: err.message });
  }
});

// Get Reservations
router.get('/GetReservations', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const user = await Student.findOne({ username: currentUsername });
    const reservations = await Reservation.find({ userId: user._id });
    const finance = await Finance.findOne({ userId: user._id });

    res.json({ balance: finance?.balance || 0, reservations });
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت اطلاعات', error: err.message });
  }
});

// Get Foods
router.get('/GetFoods', async (req, res) => {
  try {
    const restaurant = req.query.restaurant;
    const query = restaurant ? { restaurant } : {};
    const foods = await Food.find(query);
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت لیست غذاها', error: err.message });
  }
});

// Cancel Reservation
router.delete('/cancel-reservation/:id', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const user = await Student.findOne({ username: currentUsername });
    const reservation = await Reservation.findOne({ _id: req.params.id, userId: user._id });
    if (!reservation) return res.status(404).json({ message: 'رزرو یافت نشد' });

    const finance = await Finance.findOne({ userId: user._id });
    if (finance) {
      finance.balance += reservation.food.price;
      await finance.save();
    }

    await Reservation.deleteOne({ _id: req.params.id });
    res.json({ message: 'رزرو با موفقیت لغو شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در لغو رزرو', error: err.message });
  }
});

// Update Reservation
router.put('/update-reservation/:id', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const { date, restaurant, food } = req.body;
    const user = await Student.findOne({ username: currentUsername });
    const reservation = await Reservation.findOne({ _id: req.params.id, userId: user._id });
    if (!reservation) return res.status(404).json({ message: 'رزرو پیدا نشد' });

    const priceDifference = food.price - reservation.food.price;
    const finance = await Finance.findOne({ userId: user._id });
    if (finance && finance.balance < priceDifference)
      return res.status(400).json({ message: 'موجودی کافی نیست برای ویرایش رزرو' });

    if (finance) {
      finance.balance -= priceDifference;
      await finance.save();
    }

    reservation.date = date;
    reservation.restaurant = restaurant;
    reservation.food = food;
    await reservation.save();

    res.json({ message: 'ویرایش رزرو با موفقیت انجام شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ویرایش رزرو', error: err.message });
  }
});

// Add Balance
router.post('/AddBalance', async (req, res) => {
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

module.exports = router;
