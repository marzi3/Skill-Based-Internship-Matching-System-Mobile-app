const mongoose = require('mongoose');
require('dotenv').config();
const Internship = require('./src/models/Internship');
const User = require('./src/models/User');
const { getMyInternships, getSkillDemands } = require('./src/controllers/internshipController');

const mockRes = {
    status: function (s) {
        this.statusCode = s;
        return this;
    },
    json: function (j) {
        console.log('STATUS:', this.statusCode);
        console.log('DATA:', JSON.stringify(j, null, 2));
    }
};

async function runTests() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('DB Connected');

        const user = await User.findOne({ role: 'employer' });
        if (!user) {
            console.error('No employer user found');
            process.exit(1);
        }

        const mockReq = {
            user: { id: user._id.toString(), role: user.role }
        };

        console.log('\n--- Testing getMyInternships ---');
        await getMyInternships(mockReq, mockRes);

        console.log('\n--- Testing getSkillDemands ---');
        await getSkillDemands(mockReq, mockRes);

        process.exit(0);
    } catch (err) {
        console.error('Test script failed:', err);
        process.exit(1);
    }
}

runTests();
