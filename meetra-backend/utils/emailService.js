// utils/emailService.js
const nodemailer = require('nodemailer');

// Create transporter (using Gmail as example)
const createTransporter = () => {
    return nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: 'Welcome to Meetra! 🎉',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #4a6cfa, #3a5cea); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .button { background: #4a6cfa; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to Meetra! 🎉</h1>
                            <p>Your social network for Medicaps University</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${user.username}! 👋</h2>
                            <p>We're excited to have you join the Meetra community. Here's what you can do:</p>
                            <ul>
                                <li>🎯 Discover and join events around campus</li>
                                <li>👥 Connect with fellow Medicaps students</li>
                                <li>📍 Explore amazing places in Indore</li>
                                <li>💬 Chat with your connections in real-time</li>
                            </ul>
                            <p>Start exploring now and make the most of your university experience!</p>
                            <a href="${process.env.CLIENT_URL}" class="button">Start Exploring</a>
                            <div class="footer">
                                <p>If you have any questions, feel free to reach out to our support team.</p>
                                <p>© 2024 Meetra. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

// Send event notification email
const sendEventNotification = async (user, event, type = 'reminder') => {
    try {
        const transporter = createTransporter();
        
        const subject = type === 'reminder' 
            ? `Reminder: ${event.title} is coming up!` 
            : `Update: ${event.title}`;

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #4a6cfa, #3a5cea); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
                        .event-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                        .button { background: #4a6cfa; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; display: inline-block; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>${subject}</h2>
                        </div>
                        <div class="content">
                            <div class="event-details">
                                <h3>${event.title}</h3>
                                <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> ${event.time.start} - ${event.time.end}</p>
                                <p><strong>Location:</strong> ${event.location}</p>
                                <p><strong>Category:</strong> ${event.category}</p>
                            </div>
                            <a href="${process.env.CLIENT_URL}/events/${event._id}" class="button">View Event Details</a>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Event notification sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending event notification:', error);
    }
};

module.exports = {
    sendWelcomeEmail,
    sendEventNotification
};