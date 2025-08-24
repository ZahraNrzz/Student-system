const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express(); 
const port = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// DB
const connectToDatabase = require('./db');
connectToDatabase();

// Routes
const profileRoutes = require('./routes/profileRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const financeRoutes = require('./routes/financeRoutes');
const requestRoutes = require('./routes/requestRoutes');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');

app.use('/', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reservation', reservationRoutes);
app.use('/api/payments', financeRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/courses', courseRoutes);

// Route Fot HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Index.html')));
app.get('/Login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Login.html')));
app.get('/Signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Signup.html')));
app.get('/Dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Dashboard.html')));
app.get('/Profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Profile.html')));
app.get('/FoodReservation', (req, res) => res.sendFile(path.join(__dirname, 'public', 'FoodReservation.html')));
app.get('/Requests', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Requests.html')));
app.get('/Payments', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Payments.html')));
app.get('/Notifications', (req, res) => res.sendFile(path.join(__dirname, 'public', 'Notifications.html')));
app.get('/CourseList', (req, res) => res.sendFile(path.join(__dirname, 'public', 'CourseList.html')));

// Fallback
app.use((req, res) => res.status(404).send('Page Not Found'));

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}/`);
});
