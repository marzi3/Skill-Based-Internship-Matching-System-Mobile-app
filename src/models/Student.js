const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Certification name is required'],
    trim: true,
  },
  credentialUrl: {
    type: String,
    trim: true,
  },
  issuedDate: {
    type: Date,
    required: [true, 'Issued date is required'],
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true,
  },
  proficiency: {
    type: String,
    enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
    default: 'INTERMEDIATE',
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const educationSchema = new mongoose.Schema({
  institution: {
    type: String,
    required: [true, 'Institution name is required'],
    trim: true,
  },
  degree: {
    type: String,
    required: [true, 'Degree is required'],
    trim: true,
  },
  field: {
    type: String,
    required: [true, 'Field of study is required'],
    trim: true,
  },
  degreeLevel: {
    type: String,
    enum: ['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATE'],
    // Note: Not required to maintain compatibility with existing data
  },
  durationMonths: {
    type: Number,
    min: [1, 'Duration must be at least 1 month'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
  },
  isCurrentlyStudying: {
    type: Boolean,
    default: false,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const schoolSchema = new mongoose.Schema({
  school: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const uploadedCertificateSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters'],
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true,
  },
  publicId: {
    type: String,
    required: [true, 'Cloudinary public id is required'],
    trim: true,
  },
  mimeType: {
    type: String,
    trim: true,
  },
  fileSize: {
    type: Number,
    min: 0,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const projectScreenshotSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true,
  },
  publicId: {
    type: String,
    required: [true, 'Cloudinary public id is required'],
    trim: true,
  },
  mimeType: {
    type: String,
    trim: true,
  },
  fileSize: {
    type: Number,
    min: 0,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [120, 'Project title cannot exceed 120 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Project description cannot exceed 500 characters'],
  },
  technologies: [{
    type: String,
    trim: true,
  }],
  repositoryUrl: {
    type: String,
    trim: true,
  },
  liveUrl: {
    type: String,
    trim: true,
  },
  screenshots: {
    type: [projectScreenshotSchema],
    default: [],
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
  },

  // Personal Information
  personalInfo: {
    fullName: {
      type: String,
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    designation: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please use a valid phone number format (E.164)']
    },
    about: {
      type: String,
      trim: true,
      maxlength: [200, 'About cannot exceed 200 characters']
    },
    country: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 100,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },
    seniority: {
      type: [String],
      enum: ['Student', 'Graduate'],
      default: ['Student'],
    },
    // CRITICAL MATCHING ENGINE FIELDS
    gpa: {
      type: String,
      trim: true,
    },
    portfolioUrl: {
      type: String,
      trim: true,
    },
    preferredLocation: [{
      type: String,
      trim: true,
    }],
    durationPreference: {
      type: String,
      enum: ['1-3 months', '3-6 months', '6-12 months', '12+ months'],
    },
    industriesOfInterest: [{
      type: String,
      trim: true,
    }],
    previousInternshipsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },

  // Profile Image
  profileImage: {
    fileName: String,
    filePath: String,
    uploadedAt: Date,
  },

  // Cover Image
  coverImage: {
    fileName: String,
    filePath: String,
    uploadedAt: Date,
  },

  // Education Details
  education: [educationSchema],

  // Schools
  schools: [schoolSchema],

  // Skills
  skills: [skillSchema],

  // Certifications
  certifications: [certificationSchema],

  // Uploaded certificate files (separate from online certifications)
  uploadedCertificates: [uploadedCertificateSchema],

  // Projects
  projects: [projectSchema],

  // Profile Completeness
  profileCompletion: {
    personal: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    education: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    skills: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },

  // Resume
  resume: {
    fileName: String,
    filePath: String,
    uploadedAt: Date,
  },

  // Portfolio Links
  portfolio: {
    github: String,
    linkedin: String,
    website: String,
    portfolio: String,
  },

  // Status
  status: {
    type: String,
    enum: ['incomplete', 'complete', 'verified'],
    default: 'incomplete',
  },

  // Preferences
  preferences: {
    internshipType: [String], // Full-time, Part-time, Freelance, etc.
    industry: [String],
    workMode: [String], // Remote, On-site, Hybrid
  },

  // Seniority Level
  seniority: {
    type: [String],
    enum: ['Student', 'Graduate'],
    default: ['Student'],
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Index for search and common queries
studentSchema.index({ 'personalInfo.fullName': 'text', 'personalInfo.location': 'text' });
// Compound Indexes for query performance
studentSchema.index({ status: 1, 'personalInfo.preferredLocation': 1 });
studentSchema.index({ 'skills.name': 1, 'skills.proficiency': 1 });

// Calculate profile completion
studentSchema.methods.calculateProfileCompletion = function () {
  try {
    let personalScore = 0;
    let educationScore = 0;
    let skillsScore = 0;

    // Personal Info: 0-100 (prioritizing matching engine fields)
    if (this.personalInfo?.fullName) personalScore += 5;
    if (this.personalInfo?.email) personalScore += 5;
    if (this.personalInfo?.phone) personalScore += 5;
    if (this.personalInfo?.gpa) personalScore += 15; // CRITICAL for matching
    if (this.personalInfo?.portfolioUrl) personalScore += 15; // CRITICAL for matching  
    if (this.personalInfo?.preferredLocation?.length > 0) personalScore += 10; // CRITICAL for matching
    if (this.personalInfo?.industriesOfInterest && this.personalInfo.industriesOfInterest.length > 0) personalScore += 10; // CRITICAL
    if (this.personalInfo?.durationPreference) personalScore += 5;
    if (this.personalInfo?.location) personalScore += 5;
    if (this.portfolio?.github) personalScore += 5;
    if (this.portfolio?.linkedin) personalScore += 5;
    if (this.personalInfo?.dateOfBirth) personalScore += 3;
    if (this.personalInfo?.gender) personalScore += 2;
    personalScore += (this.personalInfo?.previousInternshipsCount || 0) > 0 ? 5 : 0;
    personalScore += this.personalInfo?.isPublic !== false ? 5 : 0;

    // Education: 0-100 (prioritizing degree level for matching)
    if (this.education && this.education.length > 0) {
      educationScore += 40;
      if (this.education.some(edu => edu.degreeLevel)) educationScore += 30; // CRITICAL for matching
      if (this.education.length > 1) educationScore += 30;
    }

    // Skills: 0-100 (prioritizing proficiency for matching)
    if (this.skills && this.skills.length > 0) skillsScore += 30;
    if (this.skills && this.skills.length >= 3) skillsScore += 30; // Minimum for good matching
    if (this.skills && this.skills.some(skill => skill.proficiency === 'ADVANCED' || skill.proficiency === 'EXPERT')) skillsScore += 40; // Bonus for advanced skills

    // Bonus points for additional features
    let bonusScore = 0;
    if (this.resume && this.resume.filePath) bonusScore += 10;
    if (this.certifications && this.certifications.length > 0) bonusScore += 10;
    if (this.projects && this.projects.length > 0) bonusScore += 10;

    // Cap scores at 100
    this.profileCompletion = this.profileCompletion || {};
    this.profileCompletion.personal = Math.min(personalScore + bonusScore * 0.2, 100);
    this.profileCompletion.education = Math.min(educationScore, 100);
    this.profileCompletion.skills = Math.min(skillsScore, 100);
    this.profileCompletion.overall = Math.round(
      (this.profileCompletion.personal * 0.4 +
        this.profileCompletion.education * 0.3 +
        this.profileCompletion.skills * 0.3)
    );

    // Update status based on matching readiness - only if not already manually verified
    if (this.status !== 'verified') {
      if (this.profileCompletion.overall >= 80 &&
        this.personalInfo?.gpa &&
        this.personalInfo?.preferredLocation?.length > 0 &&
        this.personalInfo?.industriesOfInterest?.length > 0 &&
        this.education && this.education.some(edu => edu.degreeLevel) &&
        this.skills && this.skills.length >= 3) {
        this.status = 'complete';
      } else if (this.profileCompletion.overall > 0) {
        this.status = 'incomplete';
      }
    }

    return this.profileCompletion;
  } catch (error) {
    console.error('Error calculating profile completion:', error);
    // Return safe defaults if calculation fails
    this.profileCompletion = this.profileCompletion || {};
    this.profileCompletion.personal = 0;
    this.profileCompletion.education = 0;
    this.profileCompletion.skills = 0;
    this.profileCompletion.overall = 0;
    return this.profileCompletion;
  }
};

// Middleware to update timestamps
studentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Student', studentSchema);
