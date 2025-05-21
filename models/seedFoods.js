const mongoose = require('mongoose');
const Food = require('./Foods');

mongoose.connect('mongodb://127.0.0.1:27017/StudentSystemDB');

const foods = [
  {
    name: 'قرمه سبزی',
    image: 'ghormeh.jpg',
    price: 85000,
    restaurant: 'رستوران مرکزی',
  },
  {
    name: 'پیتزا مخصوص',
    image: 'pizza.jpg',
    price: 120000,
    restaurant: 'رستوران شبانه',
  },
  {
    name: 'قیمه نثار',
    image: 'gheymeh.jpg',
    price: 80000,
    restaurant: 'رستوران مرکزی',
  },
  {
    name: 'لازانیا',
    image: 'lasagna.jpg',
    price: 110000,
    restaurant: 'رستوران شبانه',
  },
  {
    name: 'سالاد سبز',
    image: 'salad.jpg',
    price: 40000,
    restaurant: 'رستوران گیاهی',
  },
];

(async () => {
  try {
    await Food.insertMany(foods);
    console.log('🍽️ غذاها با موفقیت اضافه شدند');
  } catch (err) {
    console.error('❌ خطا در افزودن غذاها:', err.message);
  } finally {
    mongoose.connection.close();
  }
})();
