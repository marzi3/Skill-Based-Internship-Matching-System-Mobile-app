const mongoose = require('mongoose');
const Internship = require('./src/models/Internship');
const Student = require('./src/models/Student');
require('dotenv').config();

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const internship = await Internship.findOne().sort({ createdAt: -1 });
  const student = await Student.findOne();

  console.log('INTERNSHIP STRICT REQS:');
  console.log('minimumGPA:', internship.minimumGPA);
  console.log('requiredDegreeField:', internship.requiredDegreeField);
  console.log('educationRequirements:', internship.educationRequirements);

  console.log('\nSTUDENT STATS:');
  console.log('GPA:', student.personalInfo?.gpa);
  console.log('Degree Field:', student.education?.[0]?.field);
  console.log('Education Level:', student.education?.[0]?.degreeLevel);

  mongoose.disconnect();
}

runTest();
