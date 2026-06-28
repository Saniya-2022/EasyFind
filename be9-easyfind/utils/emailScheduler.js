const cron = require('node-cron');
const { processPendingNotifications } = require('./emailDispatcher');

/**
 * Starts the email notification scheduler
 * Runs every 2 hours
 */
function startEmailScheduler() {
  // Run every 2 hours: '0 */2 * * *'
  // For testing every 5 minutes: '*/5 * * * *'
  const task = cron.schedule('0 */2 * * *', async () => {
    console.log('⏰ Email scheduler triggered at:', new Date().toISOString());
    await processPendingNotifications();
  });

  // Optional: Run immediately on startup
  processPendingNotifications();

  console.log('✅ Email scheduler started - Running every 2 hours');
  return task;
}

module.exports = { startEmailScheduler };
