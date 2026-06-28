const nodemailer = require("nodemailer");
require("dotenv").config();
const { getEmailConfig, validateEmailConfig } = require('./emailConfig');

// Debug: Check if .env variables are loaded
console.log("=================================");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASS:",
  process.env.EMAIL_PASS ? "Loaded Successfully" : "NOT LOADED"
);
console.log("=================================");

// Validate configuration on load
if (!validateEmailConfig()) {
  console.error("⚠️  Email configuration has errors. Emails will not be sent.");
}

// Create transporter only once
const emailConfig = getEmailConfig();
const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter when server starts
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Gmail SMTP Connection Failed");
    console.error(error);
  } else {
    console.log("✅ Gmail SMTP Ready");
  }
});

const sendEmail = async (to, subject, body, isHTML = false) => {
  try {
    const mailOptions = {
      from: `"EasyFind Lost & Found" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      [isHTML ? "html" : "text"]: body,
      // Add headers to improve deliverability
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'EasyFind System',
        'Reply-To': process.env.EMAIL_USER,
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
        'MIME-Version': '1.0',
      },
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("=================================");
    console.log("✅ Email Sent Successfully");
    console.log("To:", to);
    console.log("Message ID:", info.messageId);
    console.log("=================================");

    return info;
  } catch (error) {
    console.error("=================================");
    console.error("❌ Failed to Send Email");
    console.error(error);
    console.error("=================================");

    // Throw error so caller knows sending failed
    throw error;
  }
};

module.exports = sendEmail;