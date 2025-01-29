const Contact = require('../models/Contact');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer');
const generateEmailTemplate = require('../utils/mailTemplate');

module.exports.submitForm = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const contact = new Contact({
            name,
            email,
            subject,
            message
        });

        await contact.save();
        const emailTemplate = generateEmailTemplate({
            title: 'Thank you for contacting Kartavya',
            message: `Hello ${name}, We have received your message.`,
            additionalContent: `
                <p>We will get back to you shortly.</p>
                <p>Your message details:</p>
                <p>Subject: ${subject}</p>
                <p>Message: ${message}</p>
            `
        });

        await sendEmail({
            to: email,
            subject: 'Kartavya - Contact Form Submission',
            html: emailTemplate
        });

        return res.status(201).json({
            message: 'Message sent successfully'
        });
    } catch (error) {
        console.error('Contact form error:', error);
        return res.status(500).json({
            message: 'Failed to send message',
            error: error.message
        });
    }
};

module.exports.getAll = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
                    message: "Invalid token"
                });
            }

            const admin = await User.findOne({ username: authorizedData.username });
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    message: "Only admin can view contact messages"
                });
            }

            const contacts = await Contact.find({}).sort({ date: -1 });

            return res.status(200).json({
                contacts
            });
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        return res.status(500).json({
            message: 'Failed to fetch contacts',
            error: error.message
        });
    }
};

module.exports.bulkDeleteContacts = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({ message: "Invalid token" });
            }

            const admin = await User.findOne({ username: authorizedData.username });
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({ message: "Only admin can delete messages" });
            }

            const { ids } = req.body;
            if (!ids || !Array.isArray(ids) || !ids.length) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide array of contact IDs"
                });
            }

            const result = await Contact.deleteMany({ _id: { $in: ids } });

            return res.status(200).json({
                success: true,
                message: "Contacts deleted successfully",
                deletedCount: result.deletedCount,
                totalRequested: ids.length
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports.bulkNotifyContacts = async (req, res) => {
    try {
        jwt.verify(req.token, process.env.JWT_KEY, async (err, authorizedData) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid token"
                });
            }

            const admin = await User.findOne({ username: authorizedData.username });
            if (!admin || admin.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: "Only admin can respond to messages"
                });
            }

            const { emails, subject, message } = req.body;
            if (!emails || !Array.isArray(emails) || !subject || !message) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide emails array, subject and message"
                });
            }

            const contacts = await Contact.find({ email: { $in: emails } });
            if (!contacts.length) {
                return res.status(404).json({
                    success: false,
                    message: "No contacts found with provided emails"
                });
            }

            const emailPromises = contacts.map(contact => {
                const emailTemplate = generateEmailTemplate({
                    title: subject,
                    message: `Hello ${contact.name},`,
                    additionalContent: `
                        <p>${message}</p>
                        <p>Original inquiry:</p>
                        <p>Subject: ${contact.subject}</p>
                        <p>Message: ${contact.message}</p>
                    `
                });

                return sendEmail({
                    to: contact.email,
                    subject: `Re: ${contact.subject}`,
                    html: emailTemplate
                });
            });

            await Promise.all(emailPromises);

            // Update contact records
            await Contact.updateMany(
                { email: { $in: emails } },
                {
                    $set: {
                        response: message,
                        isResponded: true,
                        respondedAt: new Date()
                    }
                }
            );

            return res.status(200).json({
                success: true,
                message: "Notifications sent successfully",
                notifiedCount: contacts.length,
                totalRequested: emails.length
            });
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};