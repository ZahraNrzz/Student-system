const express = require('express');
const fs = require('fs');
const path = require('path');
const url = require('url');

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const Reservation = require('./models/Reservation');
const Finance = require('./models/Finance');
const Food = require('./models/Foods');
const Request = require('./models/Requests');
const PaymentsFinance = require('./models/PaymentsFinance');
const Course = require('./models/Course');
const Student = require('./models/Student');

const connectToDatabase = require('./db');
connectToDatabase();

const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Get username from cookies
const getUsernameFromCookies = (cookieHeader) => {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').find(c => c.trim().startsWith('username='));
  return match ? match.split('=')[1] : null;
};

// Serve HTML files
const serveHtml = (filename, res) => {
  const filePath = path.join(__dirname, 'public', filename);
  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(500).send('خطای داخلی سرور');
    res.type('html').send(data);
  });
};

// --- Routes for HTML pages ---
const htmlRoutes = ['/', '/Login', '/Signup', '/Dashboard', '/Profile', '/FoodReservation', '/Requests', '/Payments', '/Notifications', '/CourseList'];
htmlRoutes.forEach(route => {
  app.get(route, (req, res) => {
    const file = route === '/' ? 'Index.html' : route.slice(1) + '.html';
    serveHtml(file, res);
  });
});

// === API Routes ===

// GetProfile
app.get('/GetProfile', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
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

// Signup
app.post('/Signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await Student.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      const msg = existingUser.username === username
        ? 'این نام کاربری در سامانه موجود می‌باشد!'
        : 'این ایمیل در سامانه موجود می‌باشد!';
      return res.status(400).json({ message: msg });
    }
    const newUser = new Student({ username, email, password });
    await newUser.save();
    res.status(201).json({ message: 'ثبت‌نام موفقیت‌آمیز بود!' });
  } catch (err) {
    res.status(500).json({ message: 'ثبت‌نام ناموفق بود', error: err.message });
  }
});

// Login
app.post('/Login', async (req, res) => {
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

// UpdateProfile
app.post('/UpdateProfile', upload.single('avatar'), async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const updateData = {
      ...(req.body?.username && { username: req.body.username }),
      ...(req.body?.email && { email: req.body.email }),
      ...(req.body?.password && { password: req.body.password }),
      ...(req.file && { avatarBase64: req.file.buffer.toString('base64') })
    };

    await Student.updateOne({ username: currentUsername }, { $set: updateData });
    res.json({
      message: 'اطلاعات با موفقیت ذخیره شد',
      avatarBase64: updateData.avatarBase64 || null
    });
  } catch (err) {
    res.status(500).json({ message: 'خطا در بروزرسانی پروفایل', error: err.message });
  }
});

// ReserveFood
app.post('/ReserveFood', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const user = await Student.findOne({ username: currentUsername });
    const { date, food, restaurant } = req.body;

    const finance = await Finance.findOne({ userId: user._id });
    if (!finance || finance.balance < food.price) return res.status(400).json({ message: 'موجودی کافی نیست!' });

    finance.balance -= food.price;
    await finance.save();

    const newReservation = new Reservation({ userId: user._id, date, food, restaurant });
    await newReservation.save();
    res.status(201).json({ message: 'رزرو با موفقیت انجام شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در رزرو غذا', error: err.message });
  }
});

// RechargeBalance
app.post('/RechargeBalance', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
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

// GetReservations
app.get('/GetReservations', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const user = await Student.findOne({ username: currentUsername });
    const reservations = await Reservation.find({ userId: user._id });
    const finance = await Finance.findOne({ userId: user._id });

    res.json({ balance: finance?.balance || 0, reservations });
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت اطلاعات', error: err.message });
  }
});

// GetFoods
app.get('/GetFoods', async (req, res) => {
  try {
    const restaurant = req.query.restaurant;
    const query = restaurant ? { restaurant } : {};
    const foods = await Food.find(query);
    res.json(foods);
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت لیست غذاها' });
  }
});

// CancelReservation
app.delete('/cancel-reservation/:id', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
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

// UpdateReservation
app.put('/update-reservation/:id', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const { date, restaurant, food } = req.body;
    const user = await Student.findOne({ username: currentUsername });
    const reservation = await Reservation.findOne({ _id: req.params.id, userId: user._id });
    if (!reservation) return res.status(404).json({ message: 'رزرو پیدا نشد' });

    const priceDifference = food.price - reservation.food.price;
    const finance = await Finance.findOne({ userId: user._id });
    if (finance && finance.balance < priceDifference) return res.status(400).json({ message: 'موجودی کافی نیست برای ویرایش رزرو' });

    if (finance) {
      finance.balance -= priceDifference;
      await finance.save();
    }

    reservation.date = date;
    reservation.restaurant = restaurant;
    reservation.food = food;
    await reservation.save();

    res.json({ message: 'ویرایش رزرو با موفقیت ویرایش شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ویرایش رزرو', error: err.message });
  }
});

// SendRequest
app.post('/SendRequest', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
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

// GetRequests
app.get('/GetRequests', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
    if (!currentUsername) return res.status(401).json({ message: 'Unauthorized' });

    const user = await Student.findOne({ username: currentUsername });
    const requests = await Request.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت درخواست‌ها', error: err.message });
  }
});

// PayTuition
app.post('/PayTuition', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
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

// GetTuitionStatus
app.get('/GetTuitionStatus', async (req, res) => {
  try {
    const currentUsername = getUsernameFromCookies(req.headers.cookie);
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

    res.json({ tuition, totalPaid: totalPaidSoFar, remaining: tuition - totalPaidSoFar, payments: enrichedPayments });
  } catch (err) {
    res.status(500).json({ message: 'خطا در واکشی اطلاعات مالی', error: err.message });
  }
});

// GetCourses
app.get('/GetCourses', async (req, res) => {
  try {
    const courses = await Course.aggregate([{ $sample: { size: 5 } }]);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت دروس', error: err.message });
  }
});

// Fallback
app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}/`);
});
