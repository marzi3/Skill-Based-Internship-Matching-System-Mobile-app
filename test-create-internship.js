const mongoose = require('mongoose');
const User = require('./src/models/User');
const Internship = require('./src/models/Internship');
require('dotenv').config();

async function testCreate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const email = 'gowshikaruban@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found');
            return;
        }

        const payload = {
            employer: user._id,
            company: user.companyName,
            positionTitle: 'Test Full Stack Developer',
            domain: 'Web Development',
            workEnvironment: 'Remote',
            duration: '6',
            expiryDate: '2026-12-31',
            requiredSkills: ['React.js', 'Node.js', 'MongoDB'],
            preferredSkills: ['TypeScript', 'Docker'],
            description: 'This is a test description for the perfect internship.',
            numberOfOpenings: 5,
            experienceLevel: 'Entry Level',
            prefersExperienced: true,
            stipend: { amount: 15000, currency: 'INR' },
            status: 'Hiring'
        };

        const newInternship = await Internship.create(payload);
        console.log('Created successfully:', newInternship._id);
    } catch (error) {
        console.error('Error creating:', error);
    } finally {
        mongoose.connection.close();
    }
}

testCreate();
