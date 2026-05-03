const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const Student = require('./src/models/Student');
const Internship = require('./src/models/Internship');
const User = require('./src/models/User');
const MatchingEngine = require('./src/services/matchingEngine');

mongoose.connect(process.env.MONGODB_URI);

const run = async () => {
    try {
        const user = await User.findOne({ email: 'student1@test.com' });
        const student = await Student.findOne({ userId: user._id }).lean();

        const internships = await Internship.find({
            status: { $in: ['Hiring', 'Active'] },
            expiryDate: { $gte: new Date() },
            isDeleted: { $ne: true }
        }).lean();

        console.log(`Found ${internships.length} internships.`);

        let matches = MatchingEngine.matchInternshipsForStudent(student, internships);

        console.log(`Matching Engine returned ${matches.length} matches.`);
        console.log(JSON.stringify(matches, null, 2));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
