const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const hasCloudinaryCredentials = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const uploadRoot = path.join(__dirname, '..', '..', 'uploads');

const ensureDirectory = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const getLocalDestination = (fieldname) => {
  switch (fieldname) {
    case 'profileImage':
    case 'profilePicture':
      return path.join(uploadRoot, 'profile-images');
    case 'resume':
      return path.join(uploadRoot, 'resumes');
    case 'certificateFile':
      return path.join(uploadRoot, 'certificate-files');
    case 'projectImages':
      return path.join(uploadRoot, 'project-images');
    case 'companyLogo':
      return path.join(uploadRoot, 'company-logos');
    case 'coverImage':
      return path.join(uploadRoot, 'cover-images');
    case 'studentIdImage':
    case 'businessDocument':
      return path.join(uploadRoot, 'verification');
    default:
      return path.join(uploadRoot, 'misc');
  }
};

const createDiskStorage = () => multer.diskStorage({
  destination: (req, file, cb) => {
    const destination = getLocalDestination(file.fieldname);
    ensureDirectory(destination);
    cb(null, destination);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

// Configure Cloudinary when credentials are available; otherwise fall back to local storage.
let storage;
if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      let folder = 'internmatch';

      if (file.fieldname === 'profileImage' || file.fieldname === 'profilePicture') {
        folder = 'internmatch/profile-images';
      } else if (file.fieldname === 'resume') {
        folder = 'internmatch/resumes';
      } else if (file.fieldname === 'certificateFile') {
        folder = 'internmatch/certificate-files';
      } else if (file.fieldname === 'projectImages') {
        folder = 'internmatch/project-images';
      } else if (file.fieldname === 'companyLogo') {
        folder = 'internmatch/company-logos';
      } else if (file.fieldname === 'coverImage') {
        folder = 'internmatch/cover-images';
      } else if (file.fieldname === 'studentIdImage' || file.fieldname === 'businessDocument') {
        folder = 'internmatch/verification';
      }

      const ext = path.extname(file.originalname).toLowerCase();
      return {
        folder: folder,
        resource_type: 'auto',
        public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`,
      };
    },
  });
} else {
  storage = createDiskStorage();
}

// Check file type
function checkFileType(file, cb) {
  // Allowed exact MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/i;

  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // Check exact mime
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type! Only images (JPEG, PNG, GIF, WEBP), PDFs, and Word documents (DOC, DOCX) are allowed.'));
  }
}

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = upload;
