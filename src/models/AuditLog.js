const mongoose = require('mongoose');

/**
 * @description Mongoose schema for tracking administrative actions (Audit Logs).
 */
const auditLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: [
            'APPROVE_EMPLOYER',
            'SUSPEND_EMPLOYER',
            'DELETE_LISTING',
            'FLAG_LISTING',
            'UNFLAG_LISTING',
            'GENERATE_REPORT',
            'LOGIN',
            'OTHER'
        ],
    },
    targetEntity: {
        type: String,
        required: true,
        enum: ['User', 'Internship', 'Report', 'System'],
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        // Optional, as some actions (like GENERATE_REPORT) might not target a specific document ID
    },
    details: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true
});

// Add index for faster querying by date, action, and admin
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ adminId: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
