const mongoose = require('mongoose');
const Internship = require('./src/models/Internship');
const Student = require('./src/models/Student');
require('dotenv').config();

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find the exact internship by title seen in screenshot
  const internship = await Internship.findOne({ positionTitle: 'full stack developmet' });
  
  if (!internship) {
    console.log('Internship "full stack developmet" not found');
    process.exit(1);
  }

  // Find a student that has skills 'MERN' and 'MEAN'
  const student = await Student.findOne({ 'skills.name': { $in: ['MEAN', 'MERN', 'mean', 'mern'] } });

  console.log('--- INTERNSHIP ("full stack developmet") ---');
  console.log('requiredDegreeField:', internship.requiredDegreeField);

  console.log('\n--- STUDENT (' + student.personalInfo?.fullName + ') ---');
  console.log('Education objects:');
  student.education.forEach(e => console.log(' - Field:', e.field));

  mongoose.disconnect();
}

runTest();
