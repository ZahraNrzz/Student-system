const mongoose = require('mongoose');


const courseSchema = new mongoose.Schema({
  title: String,
  code: String,
  unit: Number
});

module.exports = mongoose.model('Course', courseSchema);