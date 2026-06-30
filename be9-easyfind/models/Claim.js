const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    // References
    lostItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LostItem",
      required: true,
    },
    foundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoundItem",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userstemp",
      required: true,
    },
    
    // Student details at time of claim (all optional - populated from user/lostItem if available)
    studentDetails: {
      name: {
        type: String,
      },
      rollNo: {
        type: String,
      },
      email: {
        type: String,
      },
      contact: {
        type: String,
      },
    },

    // Matching information
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    matchReason: {
      type: String,
    },

    // Claim status
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },

    // Admin review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userstemp",
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
    },

    // QR code reference
    qrCodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QRCode",
    },

    // Audit fields
    approvedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userstemp",
    },
    
    // Additional audit fields
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userstemp",
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Userstemp",
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add audit logging middleware
claimSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    console.log(`[Audit] Claim ${this._id} status changed to ${this.status}`);
    if (this.status === 'APPROVED') {
      this.approvedAt = new Date();
    } else if (this.status === 'REJECTED') {
      this.rejectedAt = new Date();
    } else if (this.status === 'COMPLETED') {
      this.completedAt = new Date();
    }
  }
  next();
});

// Indexes for efficient queries
claimSchema.index({ userId: 1, status: 1, createdAt: -1 });
claimSchema.index({ foundItemId: 1, status: 1 });
claimSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Claim", claimSchema);