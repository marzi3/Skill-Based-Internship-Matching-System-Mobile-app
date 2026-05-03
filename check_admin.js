require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ email: 'admin@test.com' });
    if (admin) {
        console.log('Admin user found:', admin.email);
        console.log('Role:', admin.role);
        console.log('Status:', admin.status);
    } else {
        console.log('Admin user NOT found!');
        const allUsers = await User.find().select('email role');
        console.log('Available users:', allUsers);
    }
    await mongoose.disconnect();
}

checkAdmin();
