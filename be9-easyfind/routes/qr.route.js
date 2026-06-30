const express = require("express");
const router = express.Router();
router.use(express.json());
const QRCode = require("../models/QRCode");
const FoundItem = require("../models/FoundItem");
const { createQRCode, verifyQRCode, markQRAsUsed, getUserQRCodes, getPendingHandovers, generateQRCodeImage } = require("../utils/qrService");
const auth = require("../middlewares/user-auth");
const adminAuth = require("../middlewares/admin-auth");

/**
 * @route   POST /api/qr/generate/:claimId
 * @desc    Generate QR code for approved claim (Admin only)
 * @access  Private (Admin)
 */
router.post("/generate/:claimId", adminAuth, async (req, res) => {
  try {
    const { claimId } = req.params;

    // Find the claim
    const claim = await FoundItem.findById(claimId);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Validate claim status
    if (claim.status !== "claimed") {
      return res.status(400).json({ 
        message: "Item must be in claimed status to generate QR code",
        currentStatus: claim.status 
      });
    }

    // Generate QR code
    const result = await createQRCode(claim);

    res.status(201).json({
      message: "QR code generated successfully",
      qrCode: result.qrCode,
      qrImage: result.qrImage,
      verificationURL: result.verificationURL,
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({ 
      message: "Failed to generate QR code",
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/qr/verify/:token
 * @desc    Verify QR code (Public endpoint for scanning)
 * @access  Public
 */
router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const result = await verifyQRCode(token);

    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        message: result.message,
        ...(result.usedAt && { usedAt: result.usedAt }),
        ...(result.expiredAt && { expiredAt: result.expiredAt }),
      });
    }

    res.status(200).json({
      valid: true,
      message: result.message,
      item: {
        name: result.claim.itemName,
        category: result.claim.category,
        code: result.claim.code,
        claimerName: result.claim.claimerDetails?.name,
        claimerRollNo: result.claim.claimerDetails?.rollNo,
      },
    });
  } catch (error) {
    console.error("Error verifying QR code:", error);
    res.status(500).json({
      valid: false,
      message: "Error verifying QR code",
    });
  }
});

/**
 * @route   POST /api/qr/scan
 * @desc    Scan and mark QR as used (Admin only)
 * @access  Private (Admin)
 */
router.post("/scan", adminAuth, async (req, res) => {
  try {
    const { token } = req.body;
    const adminId = req.admin?.id || req.user?.id;

    if (!token) {
      return res.status(400).json({ message: "QR token is required" });
    }

    // Mark QR as used
    const qrCode = await markQRAsUsed(token, adminId);

    // Get populated claim and item details
    const Claim = require("../models/Claim");
    const claim = await Claim.findById(qrCode.claimId)
      .populate("foundItemId")
      .populate("userId", "name email rollNo");

    res.status(200).json({
      message: "QR code verified and item handed over successfully",
      qrCode: qrCode,
      claim: claim,
      item: {
        name: claim.foundItemId?.itemName,
        code: claim.foundItemId?.code,
        category: claim.foundItemId?.category,
      },
      student: {
        name: claim.studentDetails?.name,
        rollNo: claim.studentDetails?.rollNo,
        contact: claim.studentDetails?.contact,
      },
    });
  } catch (error) {
    console.error("Error scanning QR code:", error);
    res.status(400).json({
      message: error.message || "Failed to scan QR code",
    });
  }
});

/**
 * @route   GET /api/qr/my-qr-passes
 * @desc    Get current user's QR passes
 * @access  Private (User)
 */
router.get("/my-qr-passes", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const qrCodes = await getUserQRCodes(userId);

    res.status(200).json({
      count: qrCodes.length,
      qrCodes: qrCodes,
    });
  } catch (error) {
    console.error("Error fetching user QR codes:", error);
    res.status(500).json({
      message: "Failed to fetch QR passes",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/qr/pending-handovers
 * @desc    Get all pending handovers (Admin only)
 * @access  Private (Admin)
 */
router.get("/pending-handovers", adminAuth, async (req, res) => {
  try {
    const pendingHandovers = await getPendingHandovers();

    res.status(200).json({
      count: pendingHandovers.length,
      handovers: pendingHandovers,
    });
  } catch (error) {
    console.error("Error fetching pending handovers:", error);
    res.status(500).json({
      message: "Failed to fetch pending handovers",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/qr/:id
 * @desc    Get QR code details by ID
 * @access  Private (User/Admin)
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const qrCode = await QRCode.findById(req.params.id)
      .populate("claimId", "itemName category code status claimerDetails foundLocation")
      .populate("userId", "name email rollNo")
      .populate("usedBy", "name email");

    if (!qrCode) {
      return res.status(404).json({ message: "QR code not found" });
    }

    // Check if user owns this QR code or is admin
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.admin || req.user?.role === "admin";

    if (qrCode.userId.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ qrCode });
  } catch (error) {
    console.error("Error fetching QR code:", error);
    res.status(500).json({
      message: "Failed to fetch QR code",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/qr/:id/image
 * @desc    Get QR code image
 * @access  Private (User/Admin)
 */
router.get("/:id/image", auth, async (req, res) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);

    if (!qrCode) {
      return res.status(404).json({ message: "QR code not found" });
    }

    // Check if user owns this QR code or is admin
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.admin || req.user?.role === "admin";

    if (qrCode.userId.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Return stored QR image or generate if not available
    if (qrCode.qrImage) {
      const base64Data = qrCode.qrImage.replace(/^data:image\/png;base64,/, '');
      res.setHeader('Content-Type', 'image/png');
      res.send(Buffer.from(base64Data, 'base64'));
    } else {
      // Fallback: generate on-the-fly if not stored
      const verificationURL = `http://localhost:3115/api/qr/verify/${qrCode.token}`;
      const qrImage = await generateQRCodeImage(verificationURL);
      res.setHeader('Content-Type', 'image/png');
      const base64Data = qrImage.replace(/^data:image\/png;base64,/, '');
      res.send(Buffer.from(base64Data, 'base64'));
    }
  } catch (error) {
    console.error("Error generating QR image:", error);
    res.status(500).json({
      message: "Failed to generate QR image",
      error: error.message,
    });
  }
});

module.exports = router;
