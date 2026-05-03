const mongoose = require('mongoose');
const Student = require('./src/models/Student');
const User = require('./src/models/User'); // Important for populate
require('dotenv').config();

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const student = await Student.findOne({ 'resume': { $exists: true, $ne: null } }).populate('userId').lean();

  if (student) {
    console.log('STUDENT NAME:', student.userId?.name || 'Unknown User');
    console.log('RESUME OBJECT:', JSON.stringify(student.resume, null, 2));
  } else {
    console.log('No student found with a resume!');
  }

  mongoose.disconnect();
}

runTest();
