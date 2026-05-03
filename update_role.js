require('dotenv').config();
const mongoose = require('mongoose');

async function updateRole() {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await mongoose.connection.db
        .collection('users')
        .findOneAndUpdate(
            { email: 'gowshikaruban@gmail.com' },
            { $set: { role: 'employer' } },
            { returnDocument: 'after' }
        );
    if (result) {
        console.log('SUCCESS: Role updated to employer for', result.email, '- Role:', result.role);
    } else {
        console.log('ERROR: User not found with that email');
    }
    process.exit(0);
}

updateRole().catch(e => { console.error('Error:', e.message); process.exit(1); });
