require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function verifyEmployer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const email = 'gowshikaruban@gmail.com';
        let user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found with email: ${email}`);
            process.exit(1);
        }

        user.role = 'employer';
        user.isVerified = true;
        user.verificationStatus = 'approved';
        user.companyName = 'Tech Innovations Inc.';
        user.businessRegistrationNumber = 'BRN123456';
        user.website = 'https://techinnovations.example.com';

        await user.save();
        console.log(`User ${email} has been verified and updated successfully!`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

verifyEmployer();
