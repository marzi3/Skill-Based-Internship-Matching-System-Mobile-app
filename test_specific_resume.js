const mongoose = require('mongoose');
const Student = require('./src/models/Student');
const User = require('./src/models/User'); // Important for populate
require('dotenv').config();

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const userId = '69bed471fcbeb047e3dc123f'; // ID from screenshot
  
  const user = await User.findById(userId);
  if (user) {
    console.log('USER EXISTS:', user.name);
    const student = await Student.findOne({ userId: user._id }).lean();
    if (student) {
        console.log('STUDENT RECORD EXISTS.');
        console.log('RESUME DATA:', JSON.stringify(student.resume));
    } else {
        console.log('NO STUDENT RECORD EXISTS FOR THIS USER ID!');
    }
  } else {
    console.log('NO USER EXISTS WITH THIS ID:', userId);
  }

  mongoose.disconnect();
}

runTest();
