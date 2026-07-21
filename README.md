# 🎓 Student System

A full-stack **Student Management System** built with **Node.js**, **Express.js**, and **MongoDB**. The application streamlines common university services by allowing students to manage their profiles, reserve meals, view courses, submit requests, and handle financial operations through a centralized web interface.

---

## ✨ Features

- 🔐 Secure user authentication (Sign Up & Login)
- 👤 Student profile management
- 🍽️ Food reservation system
- 💳 Tuition payment management
- 💰 Student account balance management
- 📚 Course listing
- 📨 Request submission and tracking
- 🔔 Notifications dashboard
- 🌐 RESTful API using Express.js
- 🗄️ MongoDB database with Mongoose

---

## 🛠️ Tech Stack

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Frontend
- HTML5
- CSS3
- JavaScript

### Tools
- npm
- Git
- GitHub

---

## 📂 Project Structure

```text
Student-system/
│
├── models/                        # MongoDB schemas and seed scripts
│   ├── Course.js
│   ├── Finance.js
│   ├── Foods.js
│   ├── PaymentsFinance.js
│   ├── Requests.js
│   ├── Reservation.js
│   ├── Student.js
│   ├── seedCourse.js
│   └── seedFoods.js
│
├── public/                        # Frontend assets
│   ├── css/
│   │   └── Style.css
│   ├── Images/
│   ├── js/
│   │   └── Dashboard.js
│   ├── CourseList.html
│   ├── Dashboard.html
│   ├── FoodReservation.html
│   ├── Index.html
│   ├── Login.html
│   ├── Notifications.html
│   ├── Payments.html
│   ├── Profile.html
│   ├── Requests.html
│   └── Signup.html
│
├── routes/                        # Express route handlers
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── financeRoutes.js
│   ├── profileRoutes.js
│   ├── requestRoutes.js
│   └── reservationRoutes.js
│
├── Fonts/
├── db.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Seed the database

Before running the application, populate the database with the default courses and food items.

```bash
cd models
node seedCourse.js
```

Expected output:

```text
🍽️ دروس با موفقیت اضافه شدند
```

Then seed the food collection:

```bash
node seedFoods.js
```

Expected output:

```text
🍽️ غذاها با موفقیت اضافه شدند
```

Return to the project root:

```bash
cd ..
```

### 3. Start the server

```bash
node server.js
```

If everything is configured correctly, you should see:

```text
Server running at http://127.0.0.1:3001/
✅ Connected to MongoDB via Mongoose
```

The application will then be available at:

```
http://127.0.0.1:3001/
```

## 🗄️ Database Models

The project uses MongoDB with Mongoose and includes the following models:

- Student
- Course
- Foods
- Reservation
- Finance
- PaymentsFinance
- Requests

Seed files are also included for initializing sample data:

- seedCourse.js
- seedFoods.js

---

## 🌐 Main Routes

| Route | Description |
|-------|-------------|
| `/auth` | User authentication |
| `/profile` | Student profile management |
| `/reservation` | Food reservation |
| `/finance` | Tuition payments and account balance |
| `/course` | Course information |
| `/request` | Student requests |

---

## 📸 Screenshots

<img width="300" height="auto" alt="Index" src="https://github.com/user-attachments/assets/6a5b2b79-728e-4766-9388-632e215959fa" />
<img width="300" height="auto" alt="Signup" src="https://github.com/user-attachments/assets/f03d9ac1-b070-40bf-a39c-8c931dcd6e40" />
<img width="300" height="auto" alt="FoodReservation" src="https://github.com/user-attachments/assets/e0ad4a8c-a4ff-4d36-88c9-ac301ee8c86f" />
<img width="300" height="auto" alt="Requests" src="https://github.com/user-attachments/assets/a3b17ccc-e156-4e05-ae72-e49c0b79f784" />
<img width="300" height="auto" alt="CourseList" src="https://github.com/user-attachments/assets/23053b49-064c-4c0c-aca8-f40a4caafa76" />
<img width="300" height="auto" alt="Payments" src="https://github.com/user-attachments/assets/039e8d6f-f438-470f-9d72-91b1970fbb2c" />


---

## 🚀 Future Improvements

- Admin dashboard
- Role-based authorization
- Email verification
- Password recovery
- Attendance management
- Grade management
- API documentation with Swagger
- Docker support
- Unit and integration testing

---

## 👩‍💻 Author

**Zahra Norouzzadeh**

GitHub: https://github.com/ZahraNrzz

---

## 📄 License

This project is licensed under the MIT License.

---

⭐ If you found this project useful, consider giving it a star on GitHub.
