const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoundItem",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "USED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiryTime: {
      type: Date,
      required: true,
      index: true,
    },
    usedAt: {
      type: Date,
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userstemp",
    },
    verificationAttempts: {
      type: Number,
      default: 0,
    },
    lastVerificationAttempt: {
      type: Date,
    },
    qrImage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
qrCodeSchema.index({ status: 1, expiryTime: 1 });
qrCodeSchema.index({ token: 1, status: 1 });
qrCodeSchema.index({ userId: 1, status: 1 });

// Virtual for checking if QR is expired
qrCodeSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiryTime;
});

// Virtual for checking if QR is valid
qrCodeSchema.virtual("isValid").get(function () {
  return this.status === "ACTIVE" && !this.isExpired;
});

// Ensure virtuals are included in JSON
qrCodeSchema.set("toJSON", { virtuals: true });
qrCodeSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("QRCode", qrCodeSchema);