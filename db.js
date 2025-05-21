const mongoose = require('mongoose');

const connectToDatabase = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/StudentSystemDB');
    console.log('✅ Connected to MongoDB via Mongoose');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    throw err;
  }
};
module.exports = connectToDatabase;

// const { MongoClient } = require('mongodb');