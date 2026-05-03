require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function resetPasswords() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const accounts = [
        { email: 'admin@test.com', role: 'admin' },
        { email: 'employer1@test.com', role: 'employer' },
        { email: 'student1@test.com', role: 'student' }
    ];

    for (const acc of accounts) {
        const user = await User.findOne({ email: acc.email });
        if (user) {
            user.password = 'Password123!';
            user.status = 'approved';
            user.isVerified = true;
            user.verificationStatus = 'approved';
            await user.save();
            console.log(`Reset password and approved status for: ${acc.email}`);
        } else {
            console.log(`User not found: ${acc.email}`);
        }
    }
    
    await mongoose.disconnect();
}

resetPasswords();
