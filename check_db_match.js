const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Internship = require('./src/models/Internship');
const Match = require('./src/models/Match');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const jannaUser = await User.findOne({ email: 'maryamnagan01@gmail.com' });
    const student = await Student.findOne({ userId: jannaUser._id });
    const corp = await User.findOne({ companyName: /TechCorp/i });
    const intern = await Internship.findOne({ employer: corp._id, isDeleted: { $ne: true } });

    console.log('--- DB MATCH RECORD ---');
    const matchRecord = await Match.findOne({ student: student._id, internship: intern._id });
    console.log('Match Record:', JSON.stringify(matchRecord, null, 2));
    
    console.log('\n--- STUDENT PROFILE ---');
    console.log('Name:', jannaUser.name);
    console.log('Personal Info Full Name:', student.personalInfo?.fullName);
    
    mongoose.connection.close();
}
run();
