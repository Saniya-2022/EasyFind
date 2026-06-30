const mongoose = require("mongoose");

const foundItemSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
        },
        itemName: {
            type: String,
            required: true,
        },
        image: {
            url: String,
            public_id: String,
        },
        category: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        foundLocation: {
            type: String,
            required: true,
        },
        reporterRollNo: {
            type: String,
            default: "admin",
            required: true,
        },
        handoverLocation: {
            type: String,
        },
        status: {
            type: String,
            enum: ["pending", "verified", "reserved", "handed_over"],
            default: "pending",
            index: true,
        },
        claimerDetails: {
            name: {
                type: String,
            },
            rollNo: {
                type: String,
            },
            contact: {
                type: String,
            },
            dateHandovered: {
                type: Date,
                default: Date.now,
            },
            proofs: [
                {
                    url: String,
                    public_id: String,
                },
            ],
        },
        reportedDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for common queries
foundItemSchema.index({ status: 1, createdAt: -1 });
foundItemSchema.index({ reporterRollNo: 1, createdAt: -1 });

module.exports = mongoose.model("FoundItem", foundItemSchema);
