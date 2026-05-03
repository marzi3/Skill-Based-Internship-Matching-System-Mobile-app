const fs = require('fs');
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config({path: './.env'});

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({email: 'maryamnagan01@gmail.com'});
  const token = require('jsonwebtoken').sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn:'1h'});

  const FormData = require('form-data');
  const form = new FormData();
  form.append('resume', fs.createReadStream('/tmp/valid.pdf'));
  
  try {
    const fetch = (await import('node-fetch')).default || globalThis.fetch;
    const res = await fetch('http://localhost:5005/api/v1/students/profile/resume', {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.text();
    console.log('STATUS:', res.status, 'RESPONSE:', data);
  } catch (err) {
    console.log('ERROR:', err);
  }
  process.exit();
}
test();
