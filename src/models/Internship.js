const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    positionTitle: {
        type: String,
        required: [true, 'Position title is required'],
        trim: true,
        maxlength: [100, 'Position title cannot exceed 100 characters']
    },
    domain: {
        type: String,
        required: [true, 'Domain category is required'],
        trim: true
    },
    workEnvironment: {
        type: String,
        enum: ['Remote', 'On-site', 'Hybrid'],
        default: 'Remote'
    },
    location: {
        type: String,
        required: [true, 'Specific location is required'],
        trim: true
    },
    duration: {
        type: String, // String to handle "3 Months" or "12 Months" from select
        required: [true, 'Duration is required']
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required']
    },
    requiredSkills: [mongoose.Schema.Types.Mixed],
    preferredSkills: [{
        type: String,
        trim: true
    }],
    description: {
        type: String,
        required: [true, 'Internship description is required']
    },
    company: {
        type: String,
        required: [true, 'Company name is required'],
        maxlength: [150, 'Company name cannot exceed 150 characters']
    },
    status: {
        type: String,
        enum: ['Draft', 'Active', 'Paused', 'Filled', 'Expired', 'Hiring', 'Reviewing', 'Closed'],
        default: 'Hiring'
    },
    numberOfOpenings: {
        type: Number,
        default: 1
    },
    experienceLevel: {
        type: String,
        default: 'Entry Level'
    },
    minimumGPA: {
        type: Number,
        min: 0,
        max: 4.0
    },
    prefersExperienced: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    flagged: {
        type: Boolean,
        default: false
    },
    flagReason: {
        type: String,
        trim: true
    },
    educationRequirements: {
        type: String,
        trim: true
    },
    requiredDegreeField: {
        type: [String],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'At least one accepted degree field is required'
        },
        required: [true, 'Accepted degree fields are required']
    },
    stipend: {
        amount: Number,
        currency: { type: String, default: 'LKR' }
    },
    perks: [{
        type: String,
        trim: true
    }],
    views: {
        type: Number,
        default: 0
    },
    applicants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    skillMatches: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for search and common queries
internshipSchema.index({ positionTitle: 'text', description: 'text', company: 'text', domain: 'text' });
// Compound Indexes for query performance
internshipSchema.index({ status: 1, employer: 1, isDeleted: 1 });
internshipSchema.index({ status: 1, domain: 1, isDeleted: 1 });

const Internship = mongoose.model('Internship', internshipSchema);
module.exports = Internship;
