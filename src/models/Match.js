const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required']
    },
    internship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Internship',
        required: [true, 'Internship ID is required']
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Employer ID is required']
    },
    rawScore: {
        type: Number,
        required: true
    },
    normalizedScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    tier: {
        type: String,
        enum: ['EXCELLENT', 'GOOD', 'FAIR', 'WEAK', 'POOR', 'DISQUALIFIED'],
        required: true
    },
    explanations: [{
        rule: {
            type: String,
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        detail: {
            type: String,
            required: true
        }
    }],
    isViewedByStudent: {
        type: Boolean,
        default: false
    },
    isViewedByEmployer: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Pending', 'Applied', 'Rejected', 'Interacting'],
        default: 'Pending'
    },
    notified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index to ensure a unique match record per student-internship pair
matchSchema.index({ student: 1, internship: 1 }, { unique: true });

// Index for quickly retrieving best matches for an internship
matchSchema.index({ internship: 1, normalizedScore: -1 });

// Index for quickly retrieving best matches for a student
matchSchema.index({ student: 1, normalizedScore: -1 });

module.exports = mongoose.model('Match', matchSchema);
