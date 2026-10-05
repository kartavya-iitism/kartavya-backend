const nodemailer = require('nodemailer');

// Create transporter
const transporterAuto = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const transporterAdmin = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADMIN,
        pass: process.env.EMAIL_ADMIN_PASSWORD
    }
});


// Validate email configuration
const validateConfig = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Email configuration missing');
    }
    if (!process.env.EMAIL_ADMIN || !process.env.EMAIL_ADMIN_PASSWORD) {
        throw new Error('Admin Email configuration missing');
    }
};

// Send email function
const sendEmail = async (options, infoType = 'auto') => {
    try {
        validateConfig();

        if (!options.to || !options.subject) {
            throw new Error('Required email options missing');
        }

        const mailOptions = {
            from: `Kartavya IIT ISM<${infoType === 'admin' ? process.env.EMAIL_ADMIN : process.env.EMAIL_USER}>`,
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
        if (infoType === 'auto') {
            const info = await transporterAuto.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        }
        else if (infoType === 'admin') {
            const info = await transporterAdmin.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };
        }
        // console.log('Email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendEmail
};