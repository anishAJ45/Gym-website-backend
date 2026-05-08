const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verifyToken: {
        type: String,
        unique: true,
        sparse: true,
    },
    verifyTokenExpiry: {
        type: Date,
    },
    role: {
        type: String,
        enum: ["ADMIN", "TRAINER", "MEMBER"],
        default: "MEMBER",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", userSchema);
