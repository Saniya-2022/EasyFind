const LostItem = require("../models/LostItem");
const Item = require("../models/FoundItem");
const EmailNotification = require("../models/EmailNotification");
const sendEmail = require("./notifications");
const { findMatchingLostItems, SIMILARITY_THRESHOLD } = require('./semanticMatcher');
const { getLostItemMatchEmail, getClaimSubmittedEmail, getClaimApprovedEmail, getClaimRejectedEmail } = require('./emailTemplates');

/**
 * Dispatches email jobs by creating notification records
 * @param {string} type - Type of job, e.g. 'matchLostItem'
 * @param {Object} payload - Depends on job type
 */
async function dispatchEmailJob(type, payload) {
  try {
    switch (type) {
      case "matchLostItem":
        // Just store the itemId - recipients computed at processing time
        const existing = await EmailNotification.findOne({
          type: 'matchLostItem',
          relatedItem: payload.itemId,
          status: { $in: ['pending', 'processing'] },
        });

        if (!existing) {
          await EmailNotification.create({
            type: 'matchLostItem',
            relatedItem: payload.itemId,
            status: 'pending',
          });
          console.log(`📨 Email notification queued for item: ${payload.itemId}`);
          
          // Process immediately for faster notification
         setTimeout(async () => {
  try {
    const notification = await EmailNotification.findOne({
      type: "matchLostItem",
      relatedItem: payload.itemId,
      status: "pending",
    });

    if (!notification) {
      console.log("No pending notification found.");
      return;
    }

    notification.status = "processing";
    notification.lastAttempt = new Date();
    notification.attempts += 1;
    await notification.save();

    await processMatchNotification(notification);

  } catch (err) {
    console.error("⚠️ Immediate processing failed:", err);
  }
}, 1000);
          
        } else {
          console.log(`⏭️  Notification already queued for item: ${payload.itemId}`);
        }
        break;

      case "customEmail":
        await EmailNotification.create({
          type: 'customEmail',
          recipientEmail: payload.to,
          subject: payload.subject,
          body: payload.body,
          status: 'pending',
        });
        console.log(`📨 Custom email notification queued`);
        break;

      case "claimSubmitted":
        await EmailNotification.create({
          type: 'claimSubmitted',
          recipientEmail: payload.userEmail,
          userId: payload.userId,
          claimId: payload.claimId,
          foundItemId: payload.foundItemId,
          status: 'pending',
        });
        console.log(`📨 Claim submitted email queued for user: ${payload.userEmail}`);
        break;

      case "claimApproved":
        await EmailNotification.create({
          type: 'claimApproved',
          recipientEmail: payload.userEmail,
          userId: payload.userId,
          claimId: payload.claimId,
          foundItemId: payload.foundItemId,
          qrImage: payload.qrImage,
          status: 'pending',
        });
        console.log(`📨 Claim approved email queued for user: ${payload.userEmail}`);
        break;

      case "claimRejected":
        await EmailNotification.create({
          type: 'claimRejected',
          recipientEmail: payload.userEmail,
          userId: payload.userId,
          claimId: payload.claimId,
          foundItemId: payload.foundItemId,
          reviewNotes: payload.reviewNotes,
          status: 'pending',
        });
        console.log(`📨 Claim rejected email queued for user: ${payload.userEmail}`);
        break;

      default:
        console.warn("Unknown email job type:", type);
    }
  } catch (err) {
    console.error("Failed to queue email notification:", err);
  }
}

/**
 * Processes pending notifications and sends emails
 * Called by the scheduler every 2 hours
 */
async function processPendingNotifications() {
  try {
    const pendingNotifications = await EmailNotification.find({
      status: 'pending',
      attempts: { $lt: 3 },
    }).limit(50); // Process in batches

    console.log(`📬 Processing ${pendingNotifications.length} pending notifications...`);

    for (const notification of pendingNotifications) {
      // Mark as processing to avoid duplicate processing
      notification.status = 'processing';
      notification.lastAttempt = new Date();
      notification.attempts += 1;
      await notification.save();

      try {
        if (notification.type === 'matchLostItem') {
          await processMatchNotification(notification);
        } else if (notification.type === 'customEmail') {
          await sendEmail(
            notification.recipientEmail,
            notification.subject,
            notification.body
          );
          notification.status = 'completed';
          notification.emailsSent = 1;
          notification.processedAt = new Date();
          await notification.save();
          console.log(`✅ Custom email sent to: ${notification.recipientEmail}`);
        } else if (notification.type === 'claimSubmitted') {
          await processClaimSubmittedEmail(notification);
        } else if (notification.type === 'claimApproved') {
          await processClaimApprovedEmail(notification);
        } else if (notification.type === 'claimRejected') {
          await processClaimRejectedEmail(notification);
        }
      } catch (err) {
        notification.error = err.message;
        if (notification.attempts >= 3) {
          notification.status = 'failed';
        } else {
          notification.status = 'pending'; // Retry on next run
        }
        await notification.save();
        console.error(`❌ Failed to process notification ${notification._id}:`, err.message);
      }
    }

    console.log('✅ Notification processing completed');
  } catch (err) {
    console.error('Error processing notifications:', err);
  }
}

/**
 * Process match notification - find recipients and send emails
 * @param {Object} notification - EmailNotification document
 */
async function processMatchNotification(notification) {
  console.log(`\n🔍 Processing notification ${notification._id} for item ${notification.relatedItem}`);
  
  let item;
  try {
    item = await Item.findById(notification.relatedItem);
    if (!item) {
      console.error(`❌ Item not found: ${notification.relatedItem}`);
      throw new Error('Item not found');
    }
    console.log(`📦 Found item: ${item.itemName} (${item.category})`);
  } catch (error) {
    console.error('Error fetching item:', error);
    throw error;
  }

  if (!item.description) {
    console.error(`❌ Item ${item._id} has no description`);
    throw new Error('Item has no description');
  }

  try {
    const lostItems = await LostItem.find({});
    console.log(`📋 Found ${lostItems.length} lost items in database`);

    if (lostItems.length === 0) {
      console.log('⚠️  No lost items to match against');
      notification.status = 'completed';
      notification.emailsSent = 0;
      notification.processedAt = new Date();
      await notification.save();
      return;
    }

    let emailsSent = 0;

  try {
    // Use semantic matching instead of string similarity
    console.log('🤖 Starting semantic matching...');
    console.log(`   Item: "${item.itemName}" - ${item.description?.substring(0, 100)}...`);
    
    let matches;
    try {
      matches = await findMatchingLostItems(item, lostItems);
    } catch (semanticError) {
      console.error('⚠️  Semantic matching failed, using fallback keyword matching...');
      console.error('   Semantic error:', semanticError.message);
      
      // Fallback: Simple keyword matching
      matches = [];
      const itemKeywords = (item.itemName + ' ' + item.description + ' ' + item.category).toLowerCase().split(' ');
      
      for (const lostItem of lostItems) {
        const lostText = (lostItem.itemName + ' ' + lostItem.description + ' ' + lostItem.category).toLowerCase();
        const matchCount = itemKeywords.filter(keyword => lostText.includes(keyword)).length;
        const similarity = matchCount / Math.max(itemKeywords.length, 1);
        
        if (similarity >= 0.3) { // Lower threshold for fallback
          matches.push({ lostItem, similarity });
          console.log(`   🔄 Fallback match: "${lostItem.itemName}" (score: ${(similarity * 100).toFixed(2)}%)`);
        }
      }
      
      matches.sort((a, b) => b.similarity - a.similarity);
    }

    console.log(`🎯 Found ${matches.length} matches (threshold: ${SIMILARITY_THRESHOLD})`);

    if (matches.length === 0) {
      console.log('ℹ️  No matches found. For debugging:');
      console.log(`   Lost items in DB: ${lostItems.length}`);
      console.log(`   Searching for: "${item.itemName}" in category "${item.category}"`);
      console.log(`   Description: "${item.description?.substring(0, 100)}..."`);
      console.log(`   Location: "${item.foundLocation}"`);
      console.log(`   Tip: Lower SIMILARITY_THRESHOLD in .env if needed (current: ${SIMILARITY_THRESHOLD})`);
    }

    for (const match of matches) {
      const { lostItem, similarity } = match;
      
      try {
        // Generate HTML email from template
        const { subject, html } = getLostItemMatchEmail(lostItem, item);
        
        console.log(`📧 Sending email to: ${lostItem.email}`);
        await sendEmail(
          lostItem.email,
          subject,
          html,
          true // Set isHTML flag to true
        );
        emailsSent++;
        console.log(`✅ Email sent to: ${lostItem.email} (similarity: ${(similarity * 100).toFixed(2)}%)`);
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${lostItem.email}:`, emailError.message);
        console.error('   Email error details:', emailError);
      }
    }
  } catch (matchingError) {
    console.error('❌ Error in matching process:', matchingError);
    console.error('Stack:', matchingError.stack);
    // Don't throw - mark as completed with 0 emails sent
  }

    // Mark as completed
   notification.status = "completed";
notification.emailsSent = emailsSent;
notification.processedAt = new Date();

if (notification.save) {
    await notification.save();
}

    console.log(`✅ Processed item ${item._id}: ${emailsSent} emails sent\n`);
  } catch (error) {
    console.error('❌ Error in processMatchNotification:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

/**
 * Process claim submitted email
 */
async function processClaimSubmittedEmail(notification) {
  try {
    const Claim = require("../models/Claim");
    const claim = await Claim.findById(notification.claimId)
      .populate("foundItemId")
      .populate("userId", "name email");

    if (!claim) {
      throw new Error("Claim not found");
    }

    const { subject, html } = getClaimSubmittedEmail(
      claim.studentDetails?.name || claim.userId?.name || "Student",
      claim.foundItemId
    );

    await sendEmail(notification.recipientEmail, subject, html, true);

    notification.status = 'completed';
    notification.emailsSent = 1;
    notification.processedAt = new Date();
    await notification.save();

    console.log(`✅ Claim submitted email sent to: ${notification.recipientEmail}`);
  } catch (err) {
    console.error(`❌ Failed to send claim submitted email:`, err.message);
    throw err;
  }
}

/**
 * Process claim approved email
 */
async function processClaimApprovedEmail(notification) {
  try {
    const Claim = require("../models/Claim");
    const claim = await Claim.findById(notification.claimId)
      .populate("foundItemId")
      .populate("userId", "name email");

    if (!claim) {
      throw new Error("Claim not found");
    }

    const { subject, html } = getClaimApprovedEmail(
      claim.studentDetails?.name || claim.userId?.name || "Student",
      claim.foundItemId,
      notification.qrImage
    );

    await sendEmail(notification.recipientEmail, subject, html, true);

    notification.status = 'completed';
    notification.emailsSent = 1;
    notification.processedAt = new Date();
    await notification.save();

    console.log(`✅ Claim approved email sent to: ${notification.recipientEmail}`);
  } catch (err) {
    console.error(`❌ Failed to send claim approved email:`, err.message);
    throw err;
  }
}

/**
 * Process claim rejected email
 */
async function processClaimRejectedEmail(notification) {
  try {
    const Claim = require("../models/Claim");
    const claim = await Claim.findById(notification.claimId)
      .populate("foundItemId")
      .populate("userId", "name email");

    if (!claim) {
      throw new Error("Claim not found");
    }

    const { subject, html } = getClaimRejectedEmail(
      claim.studentDetails?.name || claim.userId?.name || "Student",
      claim.foundItemId,
      notification.reviewNotes
    );

    await sendEmail(notification.recipientEmail, subject, html, true);

    notification.status = 'completed';
    notification.emailsSent = 1;
    notification.processedAt = new Date();
    await notification.save();

    console.log(`✅ Claim rejected email sent to: ${notification.recipientEmail}`);
  } catch (err) {
    console.error(`❌ Failed to send claim rejected email:`, err.message);
    throw err;
  }
}

module.exports = { 
  dispatchEmailJob, 
  processPendingNotifications,
  processClaimSubmittedEmail,
  processClaimApprovedEmail,
  processClaimRejectedEmail
};
