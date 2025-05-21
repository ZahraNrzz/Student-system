// models/Student.js
const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatarBase64: String
});

const Student = mongoose.model('Student', StudentSchema);
module.exports = Student;
