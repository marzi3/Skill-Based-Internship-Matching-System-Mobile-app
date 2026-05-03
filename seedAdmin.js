const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internx', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@internx.com' });
    
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@internx.com',
        password: 'AdminPassword123!', // The model automatically hashes it
        role: 'admin',
        isVerified: true,
        verificationStatus: 'approved',
        status: 'approved'
      });
      console.log('✅ Admin user created successfully.');
    } else {
      console.log('✅ Admin user already exists. If you forgot the password, please delete the user from MongoDB and run this again.');
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    process.exit(0);
  }
};

seedAdmin();
