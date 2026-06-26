const LostItem = require("../models/LostItem");
const Item = require("../models/FoundItem");
const EmailNotification = require("../models/EmailNotification");
const sendEmail = require("./notifications");
const stringSimilarity = require("string-similarity");
const { getLostItemMatchEmail, getLostItemMatchText } = require('./emailTemplates');

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
  const item = await Item.findById(notification.relatedItem);
  if (!item) {
    throw new Error('Item not found');
  }

  if (!item.description) {
    throw new Error('Item has no description');
  }

  const lostItems = await LostItem.find({});
  let emailsSent = 0;

  for (const lostItem of lostItems) {
    const checker = [
      lostItem.itemName,
      lostItem.category,
      // lostItem.location,
      // lostItem.dateLost,
      // lostItem.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const similarity = stringSimilarity.compareTwoStrings(
      item.description.toLowerCase(),
      checker
    );

    if (similarity > 0.1) {
      // Generate HTML email from template
      const { subject, html } = getLostItemMatchEmail(lostItem, item);
      
      await sendEmail(
        lostItem.email,
        subject,
        html,
        true // Set isHTML flag to true
      );
      emailsSent++;
      console.log(`✅ Email sent to: ${lostItem.email}`);
    }
  }

  // Mark as completed
  notification.status = 'completed';
  notification.emailsSent = emailsSent;
  notification.processedAt = new Date();
  await notification.save();

  console.log(`✅ Processed item ${item._id}: ${emailsSent} emails sent`);
}

module.exports = { 
  dispatchEmailJob, 
  processPendingNotifications 
};
