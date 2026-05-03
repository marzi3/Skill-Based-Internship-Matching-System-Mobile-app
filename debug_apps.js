const mongoose = require('mongoose');
const User = require('./src/models/User');
const Application = require('./src/models/Application');
const Student = require('./src/models/Student');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('--- DATABASE CHECK ---');

    const apps = await Application.find().lean();
    console.log(`Total Applications: ${apps.length}`);
    for (const app of apps) {
        const u = await User.findById(app.student);
        console.log(`App ID: ${app._id}`);
        console.log(`  - Student Email (from User): ${u?.email}`);
        console.log(`  - Status: ${app.status}`);
    }

    const gowshika = await User.findOne({ email: /gowshika/i });
    if (gowshika) {
        console.log(`\nGowshika User Found: ${gowshika.email} (ID: ${gowshika._id})`);
        const s = await Student.findOne({ userId: gowshika._id });
        console.log(`  - Student Profile: ${s ? 'EXISTS' : 'MISSING'}`);
        const gowshikaApps = await Application.find({ student: gowshika._id });
        console.log(`  - Applications Count: ${gowshikaApps.length}`);
    } else {
        console.log('\nGowshika User NOT FOUND by email search.');
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
