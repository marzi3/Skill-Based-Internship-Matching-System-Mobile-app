const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function checkStatus() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'maryamnagan01@gmail.com' });
    if (!user) {
        console.log('User not found');
        process.exit(0);
    }
    const student = await Student.findOne({ userId: user._id });
    
    console.log('--- STATUS CHECK ---');
    console.log('User Name:', user.name);
    console.log('User Role:', user.role);
    console.log('User Verification Status:', user.verificationStatus);
    console.log('Student Profile Status:', student?.status);
    
    mongoose.connection.close();
    process.exit(0);
}
checkStatus();
