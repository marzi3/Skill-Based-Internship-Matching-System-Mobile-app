/**
 * SMTP Verification Script
 * 
 * This script tests the SMTP configuration defined in the .env file.
 * It attempts to create a transporter and send a test email.
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
    console.log('--- SMTP Configuration Test ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('From:', process.env.FROM_EMAIL || 'noreply@internmatch.com');

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('Error: SMTP_HOST, SMTP_USER, or SMTP_PASS is missing in .env');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // Helpful for debugging
        debug: true,
        logger: true
    });

    try {
        console.log('\nVerifying connection...');
        await transporter.verify();
        console.log('✅ Connection established successfully.');

        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'InternMatch Test'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send test to self
            subject: 'SMTP test - InternMatch Platform',
            text: 'Hello! This is a test email from your InternMatch platform. If you see this, your SMTP configuration is correct.',
            html: '<b>Hello!</b><p>This is a test email from your InternMatch platform. If you see this, your SMTP configuration is correct.</p>'
        };

        console.log('\nSending test email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent!');
        console.log('Message ID:', info.messageId);
        console.log('Recipient:', process.env.SMTP_USER);

    } catch (error) {
        console.error('\n❌ SMTP Error:');
        console.error(error.message);
        
        if (error.code === 'EAUTH') {
            console.error('\nTip: If you are using Gmail, make sure you have "2-Step Verification" enabled');
            console.error('and you are using an "App Password", not your regular account password.');
        }
    }
}

testSMTP();
