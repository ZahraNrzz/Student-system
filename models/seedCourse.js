const mongoose = require('mongoose');
const Course = require('./Course');

mongoose.connect('mongodb://127.0.0.1:27017/StudentSystemDB');

const sampleCourses = [
  { title: 'ساختمان داده‌ها', code: 'CS201', unit: 3 },
  { title: 'برنامه‌سازی پیشرفته', code: 'CS202', unit: 3 },
  { title: 'شبکه‌های کامپیوتری', code: 'CS301', unit: 3 },
  { title: 'پایگاه داده', code: 'CS303', unit: 3 },
  { title: 'سیستم‌عامل', code: 'CS304', unit: 3 },
  { title: 'طراحی الگوریتم‌ها', code: 'CS305', unit: 3 },
  { title: 'مدار منطقی', code: 'CS102', unit: 3 },
  { title: 'معماری کامپیوتر', code: 'CS204', unit: 3 },
  { title: 'یادگیری ماشین', code: 'CS401', unit: 3 },
  { title: 'هوش مصنوعی', code: 'CS402', unit: 3 }
];

(async () => {
  try {
    await Course.insertMany(sampleCourses);
    console.log('🍽️ دروس با موفقیت اضافه شدند');
  } catch (err) {
    console.error('❌ خطا در افزودن دروس:', err.message);
  } finally {
    mongoose.connection.close();
  }
})();
