require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const email = 'gowshikaruban@gmail.com';
        let user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found with email: ${email}`);
            process.exit(1);
        }

        // Set a known password
        user.password = 'Password123!';
        await user.save();
        console.log(`Password for ${email} has been reset successfully!`);
        console.log(`New password: Password123!`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

resetPassword();
