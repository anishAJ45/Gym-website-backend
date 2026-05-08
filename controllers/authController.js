const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { z } = require("zod");
const { sendVerificationEmail } = require("../src/lib/email");
const User = require("../models/user");




// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Valid email is required").max(100, "Email must be max 100 characters"),
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z)")
    .regex(/[0-9]/, "Password must contain at least one number (0-9)")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter (a-z)"),
});

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required").max(200),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

const resendVerificationSchema = z.object({
  email: z.string().email("Valid email is required"),
});

/**
 * Generate a secure random token
 * @returns {string}
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculate expiry time (24 hours from now)
 * @returns {Date}
 */
function getTokenExpiry() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

/**
 * Register a new user
 */
exports.register = async (req, res) => {
  try {
    // Log incoming request for debugging
    console.log("Register request received:", {
      body: req.body,
      headers: req.headers,
    });

    // Validate input with Zod
    const validatedData = registerSchema.parse(req.body);
    const { email, password } = validatedData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verifyToken = generateVerificationToken();
    const verifyTokenExpiry = getTokenExpiry();

    // Create user with verification token
    const user = await User.create({
      email,
      password: hashedPassword,
      verifyToken,
      verifyTokenExpiry,
    });

    console.log("User created successfully:", user._id);

    // Send verification email
    try {
      await sendVerificationEmail(email, verifyToken);
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      // If email fails, delete the user to maintain consistency
      await User.deleteOne({ _id: user._id });
      return res.status(500).json({
        error: "Failed to send verification email. Please try again.",
      });
    }

    res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map(e => ({
          field: e.path[0] || "unknown",
          message: e.message,
          code: e.code,
        })),
      });
    }

    console.error("Register error:", error);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * Login a user
 */
exports.login = async (req, res) => {
  try {
    // Validate input with Zod
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        error: "Please verify your email before logging in",
      });
    }

    // Generate JWT token
    const payload = { id: user._id, role: user.role, email: user.email };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      accessToken,
      role: user.role,
      message: "Login successful",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map(e => ({ field: e.path[0], message: e.message })),
      });
    }

    console.error("Login error:", error);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * Verify user email with token
 */
exports.verifyEmail = async (req, res) => {
  try {
    // Validate input with Zod
    const validatedData = verifyEmailSchema.parse(req.query);
    const { token } = validatedData;

    // Find user by verification token
    const user = await User.findOne({ verifyToken: token });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    // Check if token has expired
    if (!user.verifyTokenExpiry || user.verifyTokenExpiry < new Date()) {
      return res.status(400).json({ error: "Verification token has expired" });
    }

    // Update user: mark as verified and clear token
    const updatedUser = await User.updateOne(
      { _id: user._id },
      {
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      }
    );

    res.json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map(e => ({ field: e.path[0], message: e.message })),
      });
    }

    console.error("Verify email error:", error);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * Resend verification email
 */
exports.resendVerification = async (req, res) => {
  try {
    // Validate input with Zod
    const validatedData = resendVerificationSchema.parse(req.body);
    const { email } = validatedData;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        message:
          "If an account with this email exists, a verification email will be sent.",
      });
    }

    // If already verified, don't resend
    if (user.isVerified) {
      return res.status(200).json({
        message: "This email is already verified. Please log in.",
      });
    }

    // Generate new verification token
    const verifyToken = generateVerificationToken();
    const verifyTokenExpiry = getTokenExpiry();

    // Update user with new token
    await User.updateOne(
      { _id: user._id },
      {
        verifyToken,
        verifyTokenExpiry,
      }
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, verifyToken);
    } catch (emailError) {
      console.error("Resend verification email error:", emailError);
      return res.status(500).json({
        error: "Failed to send verification email. Please try again.",
      });
    }

    res.json({
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map(e => ({ field: e.path[0], message: e.message })),
      });
    }

    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

/**
 * Get registration validation requirements
 * Useful for frontend to display password/email requirements
 */
exports.getValidationRequirements = (req, res) => {
  res.json({
    registration: {
      email: {
        type: "string",
        format: "email",
        maxLength: 100,
        description: "Valid email address",
      },
      password: {
        type: "string",
        minLength: 8,
        requirements: [
          "At least 8 characters long",
          "At least one uppercase letter (A-Z)",
          "At least one lowercase letter (a-z)",
          "At least one number (0-9)",
        ],
      },
    },
  });
};