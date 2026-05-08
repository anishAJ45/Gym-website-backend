// src/lib/email.js

// Temporary simplified email setup for deployment/testing

const nodemailer = require("nodemailer");

// Check if email environment variables exist
const hasEmailConfig =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.EMAIL_FROM;

let transporter = null;

// Only create transporter if config exists
if (hasEmailConfig) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  console.warn("Email configuration missing. Email features disabled temporarily.");
}

// Dummy sendEmail fallback
const sendEmail = async (options) => {
  if (!transporter) {
    console.log("Skipping email send because email config is missing.");
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail,
};