const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function checkUserData(email) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('ERROR: User not found');
            process.exit(1);
        }

        console.log('USER DATA:');
        console.log('Role:', user.role);
        console.log('Verification Status:', user.verificationStatus);
        console.log('Student ID:', user.studentId);
        console.log('Student ID Image Path:', user.studentIdImage);
        console.log('Is Verified:', user.isVerified);

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('FATAL ERROR:', err);
        process.exit(1);
    }
}

checkUserData('maryamnagan04@gmail.com');
