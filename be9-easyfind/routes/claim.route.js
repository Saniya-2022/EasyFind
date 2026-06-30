
const express = require("express");
const router = express.Router();
router.use(express.json());
const Claim = require("../models/Claim");
const FoundItem = require("../models/FoundItem");
const LostItem = require("../models/LostItem");
const QRCode = require("../models/QRCode");
const { createQRCode } = require("../utils/qrService");
const { createQRReadyNotification } = require("../utils/notificationService");
const { dispatchEmailJob } = require("../utils/emailDispatcher");
const auth = require("../middlewares/user-auth");
const adminAuth = require("../middlewares/admin-auth");

/**
 * @route   POST /api/claims
 * @desc    Create a new claim (Student claims a found item)
 * @access  Private (User)
 */
router.post("/", auth, async (req, res) => {
  try {
    const { foundItemId, lostItemId } = req.body;
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;

    // Validate required fields
    if (!foundItemId || !lostItemId) {
      return res.status(400).json({ 
        message: "Found item ID and lost item ID are required" 
      });
    }

    // Check if found item exists and is in verified status
    const foundItem = await FoundItem.findById(foundItemId);
    if (!foundItem) {
      return res.status(404).json({ message: "Found item not found" });
    }

    if (foundItem.status !== "verified") {
      return res.status(400).json({ 
        message: "This item is not available for claiming",
        currentStatus: foundItem.status
      });
    }

    // Check if lost item exists and belongs to user
    const lostItem = await LostItem.findById(lostItemId);
    if (!lostItem) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    // Check ownership by email (LostItem model uses email, not userId)
    if (lostItem.email !== userEmail) {
      return res.status(403).json({ message: "You can only claim your own lost items" });
    }

    // Check if claim already exists
    const existingClaim = await Claim.findOne({
      foundItemId,
      lostItemId,
      userId,
      status: { $in: ["PENDING", "APPROVED"] }
    });

    if (existingClaim) {
      return res.status(400).json({ 
        message: "You have already submitted a claim for this item",
        claimId: existingClaim._id,
        status: existingClaim.status
      });
    }

    // Calculate match score (optional - don't fail if this errors)
    let matchScore = null;
    let matchReason = null;
    try {
      const { findMatchingLostItems } = require("../utils/semanticMatcher");
      const matches = await findMatchingLostItems(foundItem, [lostItem]);
      if (matches && matches.length > 0 && matches[0].similarity > 0) {
        matchScore = Math.round(matches[0].similarity * 100);
        matchReason = `Semantic similarity: ${(matches[0].similarity * 100).toFixed(2)}%`;
      }
    } catch (err) {
      console.log("Semantic matching skipped (non-critical):", err.message);
      // Continue without match score - claim can still be created
    }

    // Prepare student details (all optional)
    const studentDetails = {};
    if (req.user?.name || lostItem.studentName) {
      studentDetails.name = req.user?.name || lostItem.studentName;
    }
    if (req.user?.rollNo || lostItem.studentRollNo) {
      studentDetails.rollNo = req.user?.rollNo || lostItem.studentRollNo;
    }
    if (req.user?.email || lostItem.studentEmail) {
      studentDetails.email = req.user?.email || lostItem.studentEmail;
    }
    if (req.user?.contact || lostItem.studentContact) {
      studentDetails.contact = req.user?.contact || lostItem.studentContact;
    }

    // Build claim object with only defined fields
    const claimData = {
      lostItemId,
      foundItemId,
      userId,
      status: "PENDING"
    };
    
    if (matchScore !== null) claimData.matchScore = matchScore;
    if (matchReason !== null) claimData.matchReason = matchReason;
    if (Object.keys(studentDetails).length > 0) claimData.studentDetails = studentDetails;

    // Create claim
    const claim = new Claim(claimData);

    await claim.save();

    // Send email notification to student (non-blocking, fire and forget)
    const studentEmail = studentDetails.email || req.user?.email;
    if (studentEmail) {
      dispatchEmailJob("claimSubmitted", {
        userEmail: studentEmail,
        userId: userId,
        claimId: claim._id,
        foundItemId: foundItemId
      }).catch(emailError => {
        console.error("Email notification failed (non-critical):", emailError);
      });
    }

    res.status(201).json({
      message: "Claim submitted successfully",
      claim
    });
  } catch (error) {
    console.error("Error creating claim:", error);
    res.status(500).json({ 
      message: "Failed to create claim",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * @route   GET /api/claims/my-claims
 * @desc    Get current user's claims
 * @access  Private (User)
 */
router.get("/my-claims", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const claims = await Claim.find(query)
      .populate("foundItemId", "itemName image category code foundLocation status")
      .populate("lostItemId", "itemName category location dateLost")
      .populate("qrCodeId", "token status expiryTime")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: claims.length,
      claims
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    res.status(500).json({ 
      message: "Failed to fetch claims",
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/claims/pending
 * @desc    Get pending claims (Admin only)
 * @access  Private (Admin)
 */
router.get("/pending", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const claims = await Claim.find({ status: "PENDING" })
      .populate("foundItemId", "itemName image category code foundLocation description status")
      .populate("lostItemId", "itemName category location dateLost description")
      .populate("userId", "name email rollNo")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Claim.countDocuments({ status: "PENDING" });

    res.status(200).json({
      count: claims.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      claims
    });
  } catch (error) {
    console.error("Error fetching pending claims:", error);
    res.status(500).json({ 
      message: "Failed to fetch pending claims",
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/claims/:id
 * @desc    Get claim details
 * @access  Private (User/Admin)
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate("foundItemId")
      .populate("lostItemId")
      .populate("userId", "name email rollNo")
      .populate("reviewedBy", "name email")
      .populate("qrCodeId")
      .populate("completedBy", "name email");

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Check if user owns this claim or is admin
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.admin || req.user?.role === "admin";

    if (claim.userId._id.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ claim });
  } catch (error) {
    console.error("Error fetching claim:", error);
    res.status(500).json({ 
      message: "Failed to fetch claim",
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/claims
 * @desc    Get all claims (Admin only)
 * @access  Private (Admin)
 */
router.get("/", adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const claims = await Claim.find(query)
      .populate("foundItemId", "itemName image category code foundLocation status")
      .populate("lostItemId", "itemName category location dateLost")
      .populate("userId", "name email rollNo")
      .populate("reviewedBy", "name email")
      .populate("qrCodeId", "token status expiryTime")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Claim.countDocuments(query);

    res.status(200).json({
      count: claims.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      claims
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    res.status(500).json({ 
      message: "Failed to fetch claims",
      error: error.message 
    });
  }
});

/**
 * @route   PATCH /api/claims/:id/approve
 * @desc    Approve a claim (Admin only)
 * @access  Private (Admin)
 */
router.patch("/:id/approve", adminAuth, async (req, res) => {
  try {
    const adminId = req.admin?.id || req.user?.id;
    const { reviewNotes } = req.body;

    const claim = await Claim.findById(req.params.id)
      .populate("foundItemId")
      .populate("userId", "name email rollNo");

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.status !== "PENDING") {
      return res.status(400).json({ 
        message: "Claim has already been processed",
        currentStatus: claim.status 
      });
    }

    // Update claim
    claim.status = "APPROVED";
    claim.reviewedBy = adminId;
    claim.reviewedAt = new Date();
    claim.reviewNotes = reviewNotes;
    claim.approvedAt = new Date();

    await claim.save();

    // Update found item status to reserved
    await FoundItem.findByIdAndUpdate(claim.foundItemId._id, { 
      status: "reserved" 
    });

    // Generate QR code
    let qrResult = null;
    try {
      console.log("🔄 Starting QR code generation for claim:", claim._id);
      const foundItem = await FoundItem.findById(claim.foundItemId._id);
      console.log("📦 Found item:", foundItem.itemName, "Status:", foundItem.status);
      
      qrResult = await createQRCode(foundItem, claim);
      console.log("✅ QR code generated successfully:", qrResult.qrCode._id);
      console.log("📸 QR image length:", qrResult.qrImage?.length || 0);
      
      // Link QR to claim
      claim.qrCodeId = qrResult.qrCode._id;
      await claim.save();

      // Create notification
      await createQRReadyNotification(claim.userId._id, qrResult.qrCode, foundItem);

      // Send email with QR
      try {
        await dispatchEmailJob("claimApproved", {
          userEmail: claim.studentDetails.email,
          userId: claim.userId._id,
          claimId: claim._id,
          foundItemId: claim.foundItemId._id,
          qrImage: qrResult.qrImage
        });
      } catch (emailError) {
        console.error("QR email failed:", emailError);
      }
    } catch (qrError) {
      console.error("❌ QR generation failed:", qrError);
      console.error("Stack:", qrError.stack);
    }

    res.status(200).json({
      message: "Claim approved successfully",
      claim,
      qrGenerated: !!qrResult
    });
  } catch (error) {
    console.error("Error approving claim:", error);
    res.status(500).json({ 
      message: "Failed to approve claim",
      error: error.message 
    });
  }
});

/**
 * @route   PATCH /api/claims/:id/reject
 * @desc    Reject a claim (Admin only)
 * @access  Private (Admin)
 */
router.patch("/:id/reject", adminAuth, async (req, res) => {
  try {
    const adminId = req.admin?.id || req.user?.id;
    const { reviewNotes } = req.body;

    const claim = await Claim.findById(req.params.id)
      .populate("userId", "name email rollNo")
      .populate("foundItemId");

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    if (claim.status !== "PENDING") {
      return res.status(400).json({ 
        message: "Claim has already been processed",
        currentStatus: claim.status 
      });
    }

    // Update claim
    claim.status = "REJECTED";
    claim.reviewedBy = adminId;
    claim.reviewedAt = new Date();
    claim.reviewNotes = reviewNotes;

    await claim.save();

    // Send rejection notification
    try {
      await dispatchEmailJob("claimRejected", {
        userEmail: claim.studentDetails.email,
        userId: claim.userId._id,
        claimId: claim._id,
        foundItemId: claim.foundItemId._id,
        reviewNotes
      });
    } catch (emailError) {
      console.error("Rejection email failed:", emailError);
    }

    res.status(200).json({
      message: "Claim rejected successfully",
      claim
    });
  } catch (error) {
    console.error("Error rejecting claim:", error);
    res.status(500).json({ 
      message: "Failed to reject claim",
      error: error.message 
    });
  }
});

module.exports = router;
