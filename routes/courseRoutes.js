const express = require('express');
const Course = require('../models/Course');

const router = express.Router();

// Get The List Of Courses
router.get('/GetCourses', async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'خطا در دریافت دروس', error: err.message });
  }
});

module.exports = router;
