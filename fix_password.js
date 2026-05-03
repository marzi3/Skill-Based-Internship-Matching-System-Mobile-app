require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'maryamnagan01@gmail.com' });
  if (user) {
    user.password = 'iammaryam1!';
    await user.save();
    console.log('Password updated successfully!');
  } else {
    console.log('User not found');
  }
  process.exit(0);
}
fix();
