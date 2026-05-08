const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../controllers/contactController");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many messages sent. Please wait 1 hour before trying again." }
});

const validateContact = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 50 }).withMessage("Name is too long"),
  body("email")
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),
  body("message")
    .trim()
    .notEmpty().withMessage("Message is required")
    .isLength({ min: 10 }).withMessage("Message must be at least 10 characters")
    .isLength({ max: 1000 }).withMessage("Message cannot exceed 1000 characters"),
];

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post("/", contactLimiter, validateContact, checkValidation, sendContactEmail);

module.exports = router;