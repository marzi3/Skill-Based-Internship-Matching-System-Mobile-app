const mongoose = require('mongoose');
const Internship = require('./src/models/Internship');
require('dotenv').config();

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find any internship
  const internship = await Internship.findOne().sort({ createdAt: -1 });
  if (!internship) {
    console.log('No internship found');
    process.exit(1);
  }

  console.log('INTERNSHIP REQUIRED SKILLS:', JSON.stringify(internship.requiredSkills, null, 2));

  mongoose.disconnect();
}

runTest();
