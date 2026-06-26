const mongoose = require('mongoose');

const emailNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['matchLostItem', 'customEmail'],
  },
  // For matchLostItem type - store only itemId
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
  },
  // For customEmail type - store recipient details
  recipientEmail: {
    type: String,
  },
  subject: {
    type: String,
  },
  body: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  emailsSent: {
    type: Number,
    default: 0,
  },
  lastAttempt: {
    type: Date,
  },
  processedAt: {
    type: Date,
  },
  error: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
emailNotificationSchema.index({ status: 1, createdAt: 1 });
emailNotificationSchema.index({ relatedItem: 1, type: 1 });

module.exports = mongoose.model('EmailNotification', emailNotificationSchema);
