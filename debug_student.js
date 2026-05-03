const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Student = require('./src/models/Student');

dotenv.config();

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'student1@test.com' });
    console.log('User found:', JSON.stringify(user, null, 2));
    
    if (user) {
        const student = await Student.findOne({ userId: user._id });
        console.log('Student Profile found:', JSON.stringify(student, null, 2));
    }
    
    process.exit();
}

debug();
