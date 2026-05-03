const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a dummy student
    const studentExists = await User.findOne({ email: 'student@test.com' });
    if (!studentExists) {
      await User.create({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'Password123!',
        role: 'student',
        isVerified: true,
        verificationStatus: 'approved',
      });
      console.log('Test student created: student@test.com / Password123!');
    } else {
      console.log('Test student already exists');
    }

    // Create a dummy employer
    const employerExists = await User.findOne({ email: 'employer@test.com' });
    if (!employerExists) {
      await User.create({
        name: 'Test Employer',
        email: 'employer@test.com',
        password: 'Password123!',
        role: 'employer',
        companyName: 'Test Corp',
        isVerified: true,
        verificationStatus: 'approved',
      });
      console.log('Test employer created: employer@test.com / Password123!');
    } else {
      console.log('Test employer already exists');
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
