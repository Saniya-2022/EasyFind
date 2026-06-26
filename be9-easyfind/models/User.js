const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    googleId: {
        type: String
    },
    password: {
        type: String
    },
    avatar: {
        type: String
    },
    role: {
        type: String,
        enum: ["user", "security-office"],
        default: "user"
    },
    hasPassword: {
        type: Boolean,
        default: false
    }
});

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model("Userstemp", userSchema);