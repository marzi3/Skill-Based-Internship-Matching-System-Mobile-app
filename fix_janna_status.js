const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function fixStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'maryamnagan01@gmail.com' });
        if (user) {
            user.verificationStatus = 'approved';
            user.isVerified = true;
            await user.save();
            
            const student = await Student.findOne({ userId: user._id });
            if (student) {
                student.status = 'verified';
                await student.save({ validateBeforeSave: false });
                console.log('--- FIX SUCCESS ---');
                console.log(`User ${user.email} -> verified: true, verificationStatus: approved`);
                console.log(`Student profile status -> verified`);
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}
fixStatus();
