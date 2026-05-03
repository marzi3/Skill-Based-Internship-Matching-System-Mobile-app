const mongoose = require('mongoose');
const Student = require('./src/models/Student');
require('dotenv').config();

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find any student
  const student = await Student.findOne();
  if (!student) {
    console.log('No student found');
    process.exit(1);
  }

  console.log('STUDENT SKILLS:', JSON.stringify(student.skills, null, 2));

  mongoose.disconnect();
}

runTest();
