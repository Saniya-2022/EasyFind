const cron = require('node-cron');
const { expireOldQRCodes } = require('./qrService');

/**
 * Starts the QR code expiry scheduler
 * Runs every hour to expire old QR codes
 */
function startQRExpiryCron() {
  // Run every hour: '0 * * * *'
  const task = cron.schedule('0 * * * *', async () => {
    console.log('⏰ QR expiry scheduler triggered at:', new Date().toISOString());
    try {
      const result = await expireOldQRCodes();
      if (result.expired > 0) {
        console.log(`✅ Expired ${result.expired} QR codes`);
      }
    } catch (error) {
      console.error('❌ Error in QR expiry scheduler:', error);
    }
  });

  // Run immediately on startup
  expireOldQRCodes()
    .then((result) => {
      if (result.expired > 0) {
        console.log(`✅ Startup: Expired ${result.expired} QR codes`);
      } else {
        console.log('✅ No expired QR codes found on startup');
      }
    })
    .catch((error) => {
      console.error('⚠️  Error expiring QR codes on startup:', error.message);
    });

  console.log('✅ QR expiry scheduler started - Running every hour');
  return task;
}

module.exports = {
  startQRExpiryCron,
};