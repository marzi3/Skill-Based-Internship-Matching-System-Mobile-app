const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: function () { return !this.oauthProvider; }, // Password required only if not OAuth
    select: false,
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function (v) {
        // Skip validation if oauthProvider is present and password is not set
        if (this.oauthProvider && !v) return true;
        // Require at least one number and one special character
        return /^(?=.*[0-9])(?=.*[!@#$%^&*])/.test(v);
      },
      message: 'Password must contain at least one number and one special character (!@#$%^&*)'
    }
  },
  role: {
    type: String,
    enum: ['student', 'employer', 'admin'],
    default: 'student',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    default: 'pending',
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'linkedin', null],
    default: null,
  },
  providerId: {
    type: String,
    default: null,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },

  // Verification Status
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'approved', 'rejected'],
    default: 'unverified',
  },
  verificationFeedback: {
    type: String,
    trim: true,
  },

  // Student Specific
  studentId: {
    type: String,
    trim: true,
  },
  studentIdImage: {
    type: String, // Path to uploaded image
  },
  savedInternships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship'
  }],

  // Employer Specific
  companyName: {
    type: String,
    trim: true,
  },
  businessRegistrationNumber: {
    type: String,
    trim: true,
  },
  businessDocument: {
    type: String, // Path to uploaded PDF
  },
  companyDescription: {
    type: String,
    trim: true,
  },
  positionInCompany: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  industry: {
    type: String,
    trim: true,
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+', ''],
    default: '',
  },
  foundedYear: {
    type: Number,
    min: [1800, 'Founding year must be after 1800'],
    max: [new Date().getFullYear(), 'Founding year cannot be in the future']
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Email Verification
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  hasSeenTutorial: {
    type: Boolean,
    default: false,
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user is fully verified
userSchema.methods.canAccessPlatform = function () {
  if (this.role === 'admin') return true;
  return this.isVerified && this.verificationStatus === 'approved';
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (60 minutes)
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

// Generate and hash email verification token
userSchema.methods.getEmailVerificationToken = function () {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set expire time (24 hours)
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
