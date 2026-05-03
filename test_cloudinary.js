require('dotenv').config();
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
async function run() {
  try {
    const res = await cloudinary.uploader.upload('/tmp/valid.pdf', {
      resource_type: 'auto',
      folder: 'internmatch/resumes'
    });
    console.log("Success:", res);
  } catch (err) {
    console.log("Error:", err);
  }
}
run();
