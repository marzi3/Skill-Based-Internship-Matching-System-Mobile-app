const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Internship = require('./src/models/Internship');
const MatchingEngine = require('./src/services/matchingEngine');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const corp = await User.findOne({ companyName: /TechCorp/i });
    const intern = await Internship.findOne({ employer: corp._id, isDeleted: { $ne: true } });

    const students = await Student.find({}).populate('userId', 'name email').lean();
    console.log(`Total Students in DB: ${students.length}`);
    
    let candidates = MatchingEngine.matchStudentsForInternship(intern, students);
    
    console.log('\n--- MATCHED CANDIDATES ---');
    candidates.forEach((c, idx) => {
        const student = students.find(s => s._id.toString() === c.studentId.toString());
        console.log(`${idx + 1}. ${student?.userId?.name || 'Unknown'} - Score: ${c.normalizedScore}% - Tier: ${c.tier}`);
        if ((student?.userId?.name || '').toLowerCase().includes('janna')) {
            console.log('   >>> FOUND JANNA JOE!');
        }
    });

    mongoose.connection.close();
    process.exit(0);
}
run();
