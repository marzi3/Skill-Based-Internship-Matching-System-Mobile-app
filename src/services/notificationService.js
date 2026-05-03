const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const NotificationSettings = require('../models/NotificationSettings');
const User = require('../models/User');
const { emitToUser } = require('../config/socket');

/**
 * Lazily-initialised transporter.
 * Uses real SMTP creds when available; otherwise spins up a free Ethereal
 * test account so emails work out-of-the-box in development.
 */
let _transporter = null;

const getTransporter = async () => {
    if (_transporter) return _transporter;

    const hasRealCreds =
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.SMTP_USER !== 'your_email@gmail.com' &&
        process.env.SMTP_PASS !== 'your_app_password';

    if (hasRealCreds) {
        _transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT, 10) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        logger.info('[Email Service] Using configured SMTP credentials.');
    } else {
        // Generate a disposable Ethereal test account
        const testAccount = await nodemailer.createTestAccount();
        _transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        logger.info('[Email Service] No real SMTP credentials found — using Ethereal test account.');
        logger.info(`[Email Service] Ethereal user: ${testAccount.user}`);
    }

    return _transporter;
};

/**
 * Generates an HTML template for email notifications
 */
const generateEmailTemplate = (type, message, link) => {
    let title = 'InternMatch Notification';

    // Customize abstract title slightly based on type
    if (type === 'NEW_MATCH') title = 'New Internship Match!';
    else if (type === 'APPLICATION_STATUS') title = 'Application Update';
    else if (type === 'NEW_MESSAGE') title = 'New Message Received';
    else if (type === 'INTERVIEW_SCHEDULED') title = 'Interview Scheduled';
    else if (type === 'VERIFICATION_STATUS') title = 'Verification Update';
    else if (type === 'WELCOME') title = 'Welcome to InternMatch';
    else if (type === 'PASSWORD_RESET') title = 'Password Reset Request';

    const targetUrl = link && link.startsWith('/')
        ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}${link}`
        : link;

    return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
      <div style="background: linear-gradient(to right, #4f46e5, #9333ea); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900;">InternMatch.</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-top: 0;">${title}</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">${message}</p>
        
        ${targetUrl ? `
        <div style="margin-top: 32px; text-align: center;">
          <a href="${targetUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
            View Details
          </a>
        </div>
        ` : ''}
      </div>
      <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          You received this email because you opted into notifications on InternMatch.<br/>
          You can update your communication preferences in your Account Settings.
        </p>
      </div>
    </div>
  `;
};

/**
 * Helper to send email with automatic retries on failure
 */
const sendEmailWithRetry = async (to, subject, html, retries = 3) => {
    const transporter = await getTransporter();
    for (let i = 0; i < retries; i++) {
        try {
            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM || '"InternMatch" <noreply@internmatch.com>',
                to,
                subject,
                html
            });
            logger.info(`[Email Service] Sent successful email to ${to}`);

            // In dev with Ethereal, log a clickable preview URL
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                logger.info(`[Email Service] ✉ Preview URL: ${previewUrl}`);
            }

            return true;
        } catch (error) {
            logger.error(`[Email Service] Attempt ${i + 1} to send email failed:`, error.message);
            if (i === retries - 1) throw error;
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
    return false;
};

/**
 * Main function to create in-app notification and dispatch email if permitted
 */
const send = async ({ userId, type, message, link, sendEmail = true, subject, metadata }) => {
    try {
        // 1. Create In-App Notification Record
        const notification = await Notification.create({
            userId,
            type,
            message,
            link,
            metadata
        });

        // 1.5 Emit Socket event for real-time UI update
        try {
            emitToUser(userId, 'new_notification', notification);
        } catch (socketErr) {
            logger.warn('Socket emission failed in notification service', socketErr);
        }

        // 2. Resolve if email should be sent
        if (sendEmail) {
            const user = await User.findById(userId);
            if (!user) return notification;

            // Extract email (Student/Admin vs Employer)
            const emailAddress = user.email || (user.contactInfo && user.contactInfo.email);

            let shouldSendEmail = true;

            // Check User Settings
            const settings = await NotificationSettings.findOne({ userId });
            if (settings) {
                if (!settings.emailEnabled) {
                    shouldSendEmail = false;
                } else if (settings.preferences) {
                    if (type === 'NEW_MATCH' && !settings.preferences.onMatch) shouldSendEmail = false;
                    if (type === 'APPLICATION_STATUS' && !settings.preferences.onStatusChange) shouldSendEmail = false;
                    if (type === 'NEW_MESSAGE' && !settings.preferences.onMessage) shouldSendEmail = false;
                }
            }

            if (shouldSendEmail && emailAddress) {
                // Set Subject
                let finalSubject = subject || 'New Notification from InternMatch';
                if (!subject) {
                    if (type === 'NEW_MATCH') finalSubject = 'New Internship Match Recommended!';
                    else if (type === 'APPLICATION_STATUS') finalSubject = 'Update on Your Internship Application';
                    else if (type === 'NEW_MESSAGE') finalSubject = 'You have a new message on InternMatch';
                    else if (type === 'INTERVIEW_SCHEDULED') finalSubject = 'An Interview has been Scheduled';
                    else if (type === 'APPLICATION_RECEIVED') finalSubject = 'New Application Received';
                }

                const html = generateEmailTemplate(type, message, link);

                // Dispatched asynchronously (fire-and-forget) to not block the calling request
                sendEmailWithRetry(emailAddress, finalSubject, html).catch(err => {
                    logger.error('[Email Service] Final failure sending email:', err.message);
                });
            }
        }

        return notification;
    } catch (error) {
        logger.error('[Notification Service Error]', error);
        throw error;
    }
};

/**
 * Send notification to all admin users
 */
const notifyAdmins = async ({ type, message, link, subject }) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        const notifications = await Promise.all(
            admins.map(admin => send({
                userId: admin._id,
                type,
                message,
                link,
                subject
            }))
        );
        return notifications;
    } catch (error) {
        logger.error('[Notification Service] Failed to notify admins:', error);
    }
};

module.exports = {
    send,
    notifyAdmins,
    sendEmailWithRetry,
    generateEmailTemplate
};
