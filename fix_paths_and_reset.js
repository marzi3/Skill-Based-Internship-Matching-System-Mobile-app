const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function fixVerificationData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Normalize all user ID image paths
        console.log('Normalizing image paths...');
        const usersWithBackslashes = await User.find({ 
            $or: [
                { studentIdImage: { $regex: /\\/ } },
                { businessDocument: { $regex: /\\/ } }
            ]
        });
        
        for (const user of usersWithBackslashes) {
            if (user.studentIdImage) user.studentIdImage = user.studentIdImage.replace(/\\/g, '/');
            if (user.businessDocument) user.businessDocument = user.businessDocument.replace(/\\/g, '/');
            await user.save({ validateBeforeSave: false });
            console.log(`Normalized paths for ${user.email}`);
        }

        // 2. Reset Maryam to Pending for testing (requested by user)
        console.log('Resetting Maryam to pending for testing...');
        const maryam = await User.findOne({ email: 'maryamnagan04@gmail.com' });
        if (maryam) {
            maryam.verificationStatus = 'pending';
            maryam.isVerified = false;
            await maryam.save({ validateBeforeSave: false });

            const student = await Student.findOne({ userId: maryam._id });
            if (student) {
                student.status = 'complete'; // Not yet verified
                await student.save({ validateBeforeSave: false });
            }
            console.log('Maryam is now PENDING and UNVERIFIED for testing.');
        }

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('FATAL ERROR:', err);
        process.exit(1);
    }
}

fixVerificationData();
