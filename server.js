const http = require('node:http');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

    if (req.url.endsWith('.css') || req.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) return serveStaticFile(req, res);

    // GetProfile
    if (req.url === '/GetProfile') {
      (async () => {
        try {
          const { connectToDatabase } = require('./db');
          const db = await connectToDatabase();
          const users = db.collection('users');

          const currentUsername = getUsernameFromCookies(req.headers.cookie);
          if (!currentUsername) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ message: 'Unauthorized' }));
          }

          const user = await users.findOne({ username: currentUsername });
          if (user) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              username: user.username,
              email: user.email,
              password: user.password,
              avatarBase64: user.avatarBase64 || null
            }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User not found' }));
          }

        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'خطا در بارگیری اطلاعات', error: err.message }));
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
        const { connectToDatabase } = require('./db');
        const db = await connectToDatabase();
        const users = db.collection('users');

        const existingUser = await users.findOne({ username });
        const existingEmail = await users.findOne({ email });

        if (existingUser || existingEmail) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            message: existingUser ? 'این نام کاربری در سامانه موجود می‌باشد!' : 'این ایمیل در سامانه موجود می‌باشد!'
          }));
        }

        const result = await users.insertOne({ username, email, password });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'ثبت‌نام موفقیت‌آمیز بود!', userId: result.insertedId }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'ثبت‌نام موفق نبود', error: err.message }));
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
        const { connectToDatabase } = require('./db');
        const db = await connectToDatabase();
        const users = db.collection('users');

        const user = await users.findOne({ username, password });
        if (user) {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `username=${user.username}; HttpOnly`
          });
          res.end(JSON.stringify({ message: 'ورود موفقیت‌آمیز بود', username: user.username }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'نام کاربری یا رمز اشتباه است' }));
        }

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
        const { connectToDatabase } = require('./db');
        const db = await connectToDatabase();
        const users = db.collection('users');

        const currentUsername = getUsernameFromCookies(req.headers.cookie);
        if (!currentUsername) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: 'Unauthorized' }));
        }

        const updateData = {};
        if (req.body?.username) updateData.username = req.body.username;
        if (req.body?.email) updateData.email = req.body.email;
        if (req.body?.password) updateData.password = req.body.password;
        if (req.file) updateData.avatarBase64 = req.file.buffer.toString('base64');

        await users.updateOne({ username: currentUsername }, { $set: updateData });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'اطلاعات با موفقیت ذخیره شد',
          avatarBase64: updateData.avatarBase64 || null
        }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'خطا در ذخیره اطلاعات', error: err.message }));
      }
    });
    return;
  }

  // === Fallback ===
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Page Not Found');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
