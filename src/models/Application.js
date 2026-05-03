const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    internship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: true
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Applied', 'Reviewing', 'Interviewing', 'Shortlisted', 'Offered', 'Accepted', 'Rejected', 'Withdrawn'],
        default: 'Pending'
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    coverLetter: {
        type: String,
        trim: true
    },
    matchAnalysis: {
        tier: String,
        score: Number,
        explanation: [{
            rule: String,
            score: Number,
            detail: String
        }]
    },
    statusHistory: [{
        status: String,
        comment: String,
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    answers: [{
        question: String,
        answer: String
    }],
    resume: String,
    matchScore: {
        type: Number,
        default: 0
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    interviewDetails: {
        date: Date,
        time: String,
        location: String,
        notes: String
    },
    /** Whether the employer has pinned this application's conversation. */
    isPinnedByEmployer: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Avoid double applications (allow re-applying if withdrawn)
applicationSchema.index({ student: 1, internship: 1 }, { 
    unique: true,
    partialFilterExpression: { status: { $ne: 'Withdrawn' } }
});

module.exports = mongoose.model('Application', applicationSchema);
