const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./src/models/Student');
const Internship = require('./src/models/Internship');
const MatchingEngine = require('./src/services/matchingEngine');

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    const student = await Student.findOne().lean();
    const internships = await Internship.find().lean();
    const matches = MatchingEngine.matchInternshipsForStudent(student, internships);
    console.log(JSON.stringify(matches[0], null, 2));
    process.exit(0);
}
test();
