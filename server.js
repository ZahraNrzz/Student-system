const http = require('node:http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const Reservation = require('./models/Reservation');
const Finance = require('./models/Finance');
const Food = require('./models/Foods');

// --- Connect to DB
const connectToDatabase = require('./db');
const Student = require('./models/Student');
connectToDatabase();

const hostname = '127.0.0.1';
const port = 3001;

// --- Helper: Serve HTML file
const serveHtml = (filename, res) => {
  const filePath = path.join(__dirname, 'public', filename);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('خطای داخلی سرور');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  });
};
// --- Helper: Serve static files (CSS, images, etc.)
const serveStaticFile = (req, res) => {
  const filePath = path.join(__dirname, 'public', req.url);
  const ext = path.extname(filePath);
  const contentTypes = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };
  const contentType = contentTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('فایل یافت نشد');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
};

// --- Helper: Get current username from cookies
const getUsernameFromCookies = (cookieHeader) => {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').find(c => c.trim().startsWith('username='));
  return match ? match.split('=')[1] : null;
};

// === Server Start ===
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  if (req.method === 'GET') {
    if (req.url === '/') return serveHtml('Index.html', res);
    if (req.url === '/Login') return serveHtml('Login.html', res);
    if (req.url === '/Signup') return serveHtml('Signup.html', res);
    if (req.url === '/Dashboard') return serveHtml('Dashboard.html', res);
    if (req.url === '/Profile') return serveHtml('Profile.html', res);
    if (req.url === '/FoodReservation') return serveHtml('FoodReservation.html', res);


    if (req.url.endsWith('.css') || req.url.match(/\.(png|js|jpg|jpeg|gif|svg)$/)) return serveStaticFile(req, res);

    // GetProfile
    if (req.url === '/GetProfile') {
      (async () => {
        try {
          const currentUsername = getUsernameFromCookies(req.headers.cookie);
          if (!currentUsername) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Unauthorized' }));
          }

          const user = await Student.findOne({ username: currentUsername });
          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'User not found' }));
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            username: user.username,
            email: user.email,
            password: user.password,
            avatarBase64: user.avatarBase64 || null
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'خطا در دریافت پروفایل', error: err.message }));
        }
      })();
      return;
    }

  }
  // === Signup ===
  if (req.url === '/Signup' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { username, email, password } = JSON.parse(body);
        const existingUser = await Student.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
          const msg = existingUser.username === username
            ? 'این نام کاربری در سامانه موجود می‌باشد!'
            : 'این ایمیل در سامانه موجود می‌باشد!';
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: msg }));
        }

        const newUser = new Student({ username, email, password });
        await newUser.save();

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'ثبت‌نام موفقیت‌آمیز بود!' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'ثبت‌نام ناموفق بود', error: err.message }));
      }
    });
    return;
  }


  // === Login ===
  if (req.url === '/Login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { username, password } = JSON.parse(body);
        const user = await Student.findOne({ username, password });

        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'نام کاربری یا رمز اشتباه است' }));
        }

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': `username=${user.username}; HttpOnly`
        });
        res.end(JSON.stringify({ message: 'ورود موفقیت‌آمیز بود', username: user.username }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'خطا در ورود', error: err.message }));
      }
    });
    return;
  }


  // === UpdateProfile ===
  if (req.url === '/UpdateProfile' && req.method === 'POST') {
    upload.single('avatar')(req, res, async (err) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ message: 'خطا در آپلود فایل' }));
      }

      try {
        const currentUsername = getUsernameFromCookies(req.headers.cookie);
        if (!currentUsername) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Unauthorized' }));
        }

        const updateData = {
          ...(req.body?.username && { username: req.body.username }),
          ...(req.body?.email && { email: req.body.email }),
          ...(req.body?.password && { password: req.body.password }),
          ...(req.file && { avatarBase64: req.file.buffer.toString('base64') })
        };

        await Student.updateOne({ username: currentUsername }, { $set: updateData });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'اطلاعات با موفقیت ذخیره شد',
          avatarBase64: updateData.avatarBase64 || null
        }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'خطا در بروزرسانی پروفایل', error: err.message }));
      }
    });
    return;
  }

  // === FoodReservation ===
  if (req.url === '/ReserveFood' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const currentUsername = getUsernameFromCookies(req.headers.cookie);
        if (!currentUsername) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Unauthorized' }));
        }

        const user = await Student.findOne({ username: currentUsername });
        const { date, food, restaurant } = JSON.parse(body);

        const finance = await Finance.findOne({ userId: user._id });
        if (!finance || finance.balance < food.price) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'موجودی کافی نیست!' }));
        }

        finance.balance -= food.price;
        await finance.save();

        const newReservation = new Reservation({
          userId: user._id,
          date,
          food,
          restaurant,
        });

        await newReservation.save();
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'رزرو با موفقیت انجام شد' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'خطا در رزرو غذا', error: err.message }));
      }
    });
    return;
  }

  // === RechargeBalance ===
  if (req.url === '/RechargeBalance' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const currentUsername = getUsernameFromCookies(req.headers.cookie);
        if (!currentUsername) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Unauthorized' }));
        }

        const user = await Student.findOne({ username: currentUsername });
        const { amount } = JSON.parse(body);

        let finance = await Finance.findOne({ userId: user._id });
        if (!finance) {
          finance = new Finance({ userId: user._id, balance: 0 });
        }

        finance.balance += Number(amount);
        await finance.save();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'موجودی افزایش یافت', balance: finance.balance }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'خطا در افزایش موجودی', error: err.message }));
      }
    });
    return;
  }

  // === GetReservations ===
  if (req.url === '/GetReservations' && req.method === 'GET') {
    (async () => {
      try {
        const currentUsername = getUsernameFromCookies(req.headers.cookie);
        if (!currentUsername) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Unauthorized' }));
        }

        const user = await Student.findOne({ username: currentUsername });
        const reservations = await Reservation.find({ userId: user._id });
        const finance = await Finance.findOne({ userId: user._id });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          balance: finance?.balance || 0,
          reservations
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'خطا در دریافت اطلاعات', error: err.message }));
      }
    })();
    return;
  }

  // === GetFoods ===
  if (req.url.startsWith('/GetFoods') && req.method === 'GET') {
    const parsedUrl = url.parse(req.url, true);
    const restaurant = parsedUrl.query.restaurant;

    (async () => {
      try {
        const query = restaurant ? { restaurant } : {};
        const foods = await Food.find(query); 
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(foods));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'خطا در دریافت لیست غذاها' }));
      }
    })();

    return;
  }

  // === Cancel Reservation ===
  if (req.method === 'DELETE' && req.url.startsWith('/cancel-reservation/')) {
    const id = req.url.split('/').pop();
    const currentUsername = getUsernameFromCookies(req.headers.cookie);

    if (!currentUsername) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'Unauthorized' }));
    }

    (async () => {
      try {
        const user = await Student.findOne({ username: currentUsername });
        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'User not found' }));
        }

        const reservation = await Reservation.findOne({ _id: id, userId: user._id });
        if (!reservation) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'رزرو یافت نشد' }));
        }

        const finance = await Finance.findOne({ userId: user._id });
        if (finance) {
          finance.balance += reservation.food.price;
          await finance.save();
        }

        await Reservation.deleteOne({ _id: id });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'رزرو با موفقیت لغو شد' }));
      } catch (err) {
        console.error('Error canceling reservation:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'خطا در لغو رزرو', error: err.message }));
      }
    })();
    return;
  }


  // === Fallback ===
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Page Not Found');
  });

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
