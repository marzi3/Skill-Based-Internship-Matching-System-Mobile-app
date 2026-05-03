const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Skill name is required'],
        unique: true,
        trim: true,
        index: true // Indexed for fast searching during matching
    },
    category: {
        type: String,
        enum: ['Technical', 'Soft Skill', 'Tool', 'Language', 'Domain Knowledge', 'Other'],
        default: 'Other'
    },
    description: {
        type: String,
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: true // Assume default skills are verified, user-added might need review
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Null if seeded/created by system admin
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Skill', skillSchema);
