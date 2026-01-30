const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register User (Optional, for creating users/admins)
exports.register = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ error: "User already exists" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            email,
            password: hashedPassword,
            role: role || "user"
        });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // Create Token
        const payload = {
            id: user._id,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || "your_jwt_secret", {
            expiresIn: "1h"
        });

        res.json({ token, role: user.role, message: "Login successful" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
