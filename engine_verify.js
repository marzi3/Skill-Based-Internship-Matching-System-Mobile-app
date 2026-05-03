const mongoose = require('mongoose');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Internship = require('./src/models/Internship');
const MatchingEngine = require('./src/services/matchingEngine');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function verify() {
    await mongoose.connect(process.env.MONGODB_URI);
    const janna = await User.findOne({ email: 'maryamnagan01@gmail.com' }).lean();
    const profile = await Student.findOne({ userId: janna._id }).lean();
    const corp = await User.findOne({ companyName: /TechCorp/i }).lean();
    const intern = await Internship.findOne({ employer: corp._id, isDeleted: { $ne: true } }).lean();

    const result = MatchingEngine.explainMatch(profile, intern);
    console.log(`Final Score: ${result.normalizedScore}% Tier: ${result.tier}`);
    
    console.log('\n--- EXPLANATION LOG ---');
    result.explanation.forEach(exp => {
        const sign = exp.score < 0 ? '' : '+';
        console.log(`[${exp.rule}] (${sign}${exp.score}): ${exp.detail}`);
    });
    
    mongoose.connection.close();
    process.exit(0);
}
verify();
