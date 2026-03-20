const express = require("express");
const router = express.Router();
const { login, register } = require("../controllers/authController");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again after 15 minutes." }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many accounts created. Please try again after 1 hour." }
});

const validateRegister = [
  body("email")
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain a number"),
  body("email")
    .isLength({ max: 100 }).withMessage("Email too long"),
];

const validateLogin = [
  body("email")
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ max: 200 }).withMessage("Invalid input"),
];

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post("/register", registerLimiter, validateRegister, checkValidation, register);
router.post("/login", loginLimiter, validateLogin, checkValidation, login);

module.exports = router;