const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { send } = require('../src/services/notificationService');
const { connectDB } = require('../src/config/database');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');

async function testNotifications() {
    try {
        console.log('--- Notification System Verification ---');

        // 1. Connect to Database
        await connectDB();
        console.log('✓ Connected to MongoDB');

        // 2. Find or Create a Test User
        let testUser = await User.findOne({ email: 'test@example.com' });
        if (!testUser) {
            console.log('Creating test user...');
            testUser = await User.create({
                name: 'Test User',
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'Password123!',
                role: 'student'
            });
        }
        console.log(`✓ Using test user: ${testUser.email} (${testUser._id})`);

        // 3. Send a Test Notification
        console.log('Sending test notification...');
        const notification = await send({
            userId: testUser._id,
            type: 'NEW_MATCH',
            message: 'Congratulations! You have a new internship match for "Software Engineer Intern".',
            link: '/internships/search',
            subject: 'System Test: New Match Found'
        });

        if (notification) {
            console.log('✓ Notification record created in database');
            console.log('Notification ID:', notification._id);
        } else {
            throw new Error('Failed to create notification record');
        }

        // 4. Verify in Database
        const verifiedNotif = await Notification.findById(notification._id);
        if (verifiedNotif) {
            console.log('✓ Verification: Notification found in database with correct message');
        } else {
            console.log('✗ Verification: Notification NOT found in database');
        }

        console.log('\n--- Verification Complete ---');
        console.log('Check the backend terminal logs for [Email Service] output to verify email dispatch.');

        process.exit(0);
    } catch (error) {
        console.error('✗ Verification Failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testNotifications();
