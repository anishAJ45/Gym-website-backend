const nodemailer = require("nodemailer");
const Contact = require("../models/contact");

const sendContactEmail = async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: "Please fill in all fields (name, email, message)." });
    }

    try {
        // Save to database
        const newContact = new Contact({ name, email, message });
        await newContact.save();

        // Create a transporter using Gmail (defaulting to this as it's common)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Define email options
        const mailOptions = {
            from: email,
            to: process.env.EMAIL_USER,
            subject: `New Contact Form Submission from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: "Message sent and saved successfully!" });
    } catch (error) {
        console.error("Error handling contact form:", error);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

module.exports = { sendContactEmail };
