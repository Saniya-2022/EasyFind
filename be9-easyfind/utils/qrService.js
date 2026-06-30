const crypto = require("crypto");
const QRCode = require("../models/QRCode");
const FoundItem = require("../models/FoundItem");
const Claim = require("../models/Claim");
const User = require("../models/User");
const sendEmail = require("./notifications");
const { getQRCodeEmail } = require("./emailTemplates");
const QRCodeLib = require("qrcode");

/**
 * Generate a secure random token
 * @param {number} length - Length of token in bytes (default: 32)
 * @returns {string} - Hex token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate QR code as base64 image
 * @param {string} data - Data to encode in QR
 * @returns {Promise<string>} - Base64 encoded QR image
 */
async function generateQRCodeImage(data) {
  try {
    const qrDataUrl = await QRCodeLib.toDataURL(data, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });
    return qrDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate verification URL
 * @param {string} token - Secure token
 * @returns {string} - Verification URL
 */
function generateVerificationURL(token) {
  const baseUrl = process.env.BACKEND_URL || "http://localhost:3115";
  return `${baseUrl}/api/qr/verify/${token}`;
}

/**
 * Create QR code for approved claim
 * @param {Object} foundItem - FoundItem with status: reserved
 * @param {Object} claim - Claim document
 * @returns {Promise<Object>} - QR code document
 */
async function createQRCode(foundItem, claim) {
  try {
    console.log("🔍 Starting QR code creation...");
    console.log("  - Found Item:", foundItem._id, "Status:", foundItem.status);
    console.log("  - Claim:", claim._id, "Status:", claim.status);
    console.log("  - User:", claim.userId);

    // Validate found item status
    if (foundItem.status !== "reserved") {
      throw new Error(`Item must be in reserved status to generate QR code. Current status: ${foundItem.status}`);
    }

    // Validate claim status
    if (claim.status !== "APPROVED") {
      throw new Error(`Claim must be approved to generate QR code. Current status: ${claim.status}`);
    }

    // Check if QR already exists for this claim
    const existingQR = await QRCode.findOne({
      claimId: claim._id,
      status: { $in: ["ACTIVE", "USED"] },
    });

    if (existingQR) {
      console.log("⚠️  QR code already exists for this claim:", existingQR._id);
      // Return existing QR code
      const verificationURL = generateVerificationURL(existingQR.token);
      return {
        qrCode: existingQR,
        qrImage: existingQR.qrImage || await generateQRCodeImage(verificationURL),
        verificationURL,
      };
    }

    // Generate secure token
    const token = generateSecureToken(32);
    console.log("🔑 Generated token:", token.substring(0, 16) + "...");

    // Set expiry time (24 hours from now)
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24);
    console.log("⏰ Expiry time:", expiryTime);

    // Generate QR code image
    const verificationURL = generateVerificationURL(token);
    console.log("🔗 Verification URL:", verificationURL);
    
    console.log("📸 Generating QR code image...");
    const qrImage = await generateQRCodeImage(verificationURL);
    console.log("✅ QR image generated, length:", qrImage.length, "characters");
    console.log("  Preview:", qrImage.substring(0, 50) + "...");

    // Create QR code document
    const qrCode = new QRCode({
      claimId: claim._id,
      itemId: foundItem._id,
      userId: claim.userId,
      token: token,
      status: "ACTIVE",
      expiryTime: expiryTime,
      qrImage: qrImage,
    });

    console.log("💾 Saving QR code to database...");
    await qrCode.save();
    console.log("✅ QR code saved to database:", qrCode._id);

    // Send email to claimant
    console.log("📧 Sending email notification...");
    await sendQRCodeEmail(foundItem, qrCode, qrImage, verificationURL, claim);

    console.log(`✅ QR code creation completed successfully for claim: ${claim._id}`);
    console.log(`   QR Code ID: ${qrCode._id}`);
    console.log(`   Token: ${token}`);
    console.log(`   Image length: ${qrImage.length} chars`);

    return {
      qrCode,
      qrImage,
      verificationURL,
    };
  } catch (error) {
    console.error("❌ Error creating QR code:", error);
    console.error("Stack trace:", error.stack);
    throw error;
  }
}

/**
 * Send QR code email to claimant
 * @param {Object} foundItem - Found item details
 * @param {Object} qrCode - QR code document
 * @param {string} qrImage - Base64 QR image
 * @param {string} verificationURL - Verification URL
 * @param {Object} claim - Claim details
 */
async function sendQRCodeEmail(foundItem, qrCode, qrImage, verificationURL, claim) {
  try {
    const { subject, html } = getQRCodeEmail(foundItem, qrCode, qrImage, verificationURL);

    await sendEmail(
      claim.studentDetails.email,
      subject,
      html,
      true
    );

    console.log(`📧 QR code email sent to: ${claim.studentDetails.email}`);
  } catch (error) {
    console.error("Error sending QR code email:", error);
    // Don't throw - QR code is created even if email fails
  }
}

/**
 * Verify QR code token
 * @param {string} token - QR token to verify
 * @returns {Promise<Object>} - Verification result
 */
async function verifyQRCode(token) {
  try {
    // Find QR code
    const qrCode = await QRCode.findOne({ token: token });

    if (!qrCode) {
      return {
        valid: false,
        message: "Invalid QR code. This code does not exist in our system.",
      };
    }

    // Update verification attempts
    qrCode.verificationAttempts += 1;
    qrCode.lastVerificationAttempt = new Date();
    await qrCode.save();

    // Check if already used
    if (qrCode.status === "USED") {
      return {
        valid: false,
        message: "This QR code has already been used.",
        usedAt: qrCode.usedAt,
        usedBy: qrCode.usedBy,
      };
    }

    // Check if expired
    if (qrCode.status === "EXPIRED" || new Date() > qrCode.expiryTime) {
      // Mark as expired if not already
      if (qrCode.status !== "EXPIRED") {
        qrCode.status = "EXPIRED";
        await qrCode.save();
      }

      return {
        valid: false,
        message: "This QR code has expired.",
        expiredAt: qrCode.expiryTime,
      };
    }

    // Check if active
    if (qrCode.status !== "ACTIVE") {
      return {
        valid: false,
        message: `This QR code is ${qrCode.status.toLowerCase()}.`,
      };
    }

    // Get claim details
    const claim = await Claim.findById(qrCode.claimId)
      .populate("foundItemId")
      .populate("userId", "name email rollNo");
    
    if (!claim) {
      return {
        valid: false,
        message: "Associated claim not found.",
      };
    }

    // Check if claim is approved
    if (claim.status !== "APPROVED") {
      return {
        valid: false,
        message: `Claim status is ${claim.status}. Only approved claims can be verified.`,
      };
    }

    // Check if found item is reserved
    const foundItem = await FoundItem.findById(claim.foundItemId);
    if (!foundItem || foundItem.status !== "reserved") {
      return {
        valid: false,
        message: "Item is not in reserved status.",
      };
    }

    // Return valid verification
    return {
      valid: true,
      message: "QR code is valid",
      qrCode: qrCode,
      claim: claim,
      foundItem: foundItem,
    };
  } catch (error) {
    console.error("Error verifying QR code:", error);
    return {
      valid: false,
      message: "Error verifying QR code. Please try again.",
    };
  }
}

/**
 * Mark QR code as used
 * @param {string} token - QR token
 * @param {ObjectId} adminId - Admin who scanned the QR
 * @returns {Promise<Object>} - Updated QR code
 */
async function markQRAsUsed(token, adminId) {
  try {
    const qrCode = await QRCode.findOne({ token: token });

    if (!qrCode) {
      throw new Error("QR code not found");
    }

    if (qrCode.status !== "ACTIVE") {
      throw new Error(`QR code is already ${qrCode.status.toLowerCase()}`);
    }

    if (new Date() > qrCode.expiryTime) {
      qrCode.status = "EXPIRED";
      await qrCode.save();
      throw new Error("QR code has expired");
    }

    // Get claim
    const claim = await Claim.findById(qrCode.claimId);
    if (!claim) {
      throw new Error("No claim associated with this QR code");
    }

    if (claim.status !== "APPROVED") {
      throw new Error(`Claim status is ${claim.status}. Only approved claims can be completed.`);
    }

    // Mark QR as used
    qrCode.status = "USED";
    qrCode.usedAt = new Date();
    qrCode.usedBy = adminId;
    await qrCode.save();

    // Update claim status
    claim.status = "COMPLETED";
    claim.completedAt = new Date();
    claim.completedBy = adminId;
    await claim.save();

    // Update found item status
    await FoundItem.findByIdAndUpdate(claim.foundItemId, { 
      status: "handed_over",
      $set: {
        "claimerDetails.dateHandovered": new Date()
      }
    });

    console.log(`✅ QR code marked as used: ${token}`);

    return qrCode;
  } catch (error) {
    console.error("Error marking QR as used:", error);
    throw error;
  }
}

/**
 * Get user's QR codes
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Array>} - User's QR codes with populated details
 */
async function getUserQRCodes(userId) {
  try {
    const qrCodes = await QRCode.find({ userId: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "claimId",
        populate: {
          path: "foundItemId",
          select: "itemName image category code foundLocation status"
        }
      })
      .populate("usedBy", "name email");

    // Ensure qrImage is populated for all QR codes
    for (const qr of qrCodes) {
      if (!qr.qrImage && qr.token) {
        console.log(`🔄 Generating missing QR image for: ${qr._id}`);
        try {
          const verificationURL = generateVerificationURL(qr.token);
          qr.qrImage = await generateQRCodeImage(verificationURL);
          
          // Update in database
          await QRCode.findByIdAndUpdate(qr._id, { qrImage: qr.qrImage });
          console.log(`✅ QR image generated and saved for: ${qr._id}`);
        } catch (err) {
          console.error(`❌ Failed to generate QR image for ${qr._id}:`, err);
        }
      }
    }

    return qrCodes;
  } catch (error) {
    console.error("Error getting user QR codes:", error);
    throw error;
  }
}

/**
 * Get all pending handovers (for admin)
 * @returns {Promise<Array>} - Pending handovers with QR codes
 */
async function getPendingHandovers() {
  try {
    const pendingHandovers = await QRCode.find({
      status: "ACTIVE",
      expiryTime: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "claimId",
        populate: [
          {
            path: "foundItemId",
            select: "itemName image category code foundLocation status"
          },
          {
            path: "userId",
            select: "name email rollNo"
          }
        ]
      })
      .populate("usedBy", "name email");

    return pendingHandovers;
  } catch (error) {
    console.error("Error getting pending handovers:", error);
    throw error;
  }
}

/**
 * Expire old QR codes
 * @returns {Promise<Object>} - Expiry statistics
 */
async function expireOldQRCodes() {
  try {
    const result = await QRCode.updateMany(
      {
        status: "ACTIVE",
        expiryTime: { $lt: new Date() },
      },
      {
        status: "EXPIRED",
      }
    );

    console.log(`⏰ Expired ${result.modifiedCount} QR codes`);

    return {
      expired: result.modifiedCount,
    };
  } catch (error) {
    console.error("Error expiring QR codes:", error);
    throw error;
  }
}

module.exports = {
  generateSecureToken,
  generateQRCodeImage,
  generateVerificationURL,
  createQRCode,
  verifyQRCode,
  markQRAsUsed,
  getUserQRCodes,
  getPendingHandovers,
  expireOldQRCodes,
};