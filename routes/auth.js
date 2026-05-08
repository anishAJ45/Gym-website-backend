const express = require("express");
const router = express.Router();
const {
  login,
  register,
  verifyEmail,
  resendVerification,
  getValidationRequirements,
} = require("../controllers/authController");

// Routes (Rate limiting temporarily removed for testing/demo)

router.get("/requirements", getValidationRequirements);

router.post("/register", register);

router.post("/login", login);

router.get("/verify-email", verifyEmail);

router.post("/resend-verification", resendVerification);

module.exports = router;