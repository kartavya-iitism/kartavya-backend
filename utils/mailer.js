const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Validate email configuration
const validateConfig = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Email configuration missing');
    }
};

// Send email function
const sendEmail = async (options) => {
    try {
        validateConfig();

        if (!options.to || !options.subject) {
            throw new Error('Required email options missing');
        }

        const mailOptions = {
            from: `Kartavya IIT ISM<${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text || '',
            html: options.html || '',
            alternatives: options.html ? [
                {
                    contentType: 'text/plain',
                    content: options.text
                },
                {
                    contentType: 'text/html',
                    content: options.html
                }
            ] : undefined,
            attachments: options.attachments || []
        };

        const info = await transporter.sendMail(mailOptions);
        // console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendEmail
};