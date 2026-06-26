const nodemailer = require("nodemailer");
require("dotenv").config();

const sendEmail = async (to, subject, body, isHTML = false) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Set in `.env`
        pass: process.env.EMAIL_PASS, // Set in `.env`
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      [isHTML ? "html" : "text"]: body,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendEmail;
