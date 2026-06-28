/**
 * Test script to verify email functionality
 * Run with: node test-email.js
 */

require('dotenv').config();
const sendEmail = require('./utils/notifications');

async function testEmail() {
  console.log('🧪 Testing email functionality...\n');
  
  const testEmail = process.env.EMAIL_USER; // Send to yourself
  const subject = 'Test Email - EasyFind';
  const html = `
    <h1>Test Email</h1>
    <p>This is a test email from EasyFind system.</p>
    <p>If you receive this, email functionality is working correctly!</p>
    <p>Time: ${new Date().toLocaleString()}</p>
  `;

  try {
    console.log(`📧 Sending test email to: ${testEmail}`);
    await sendEmail(testEmail, subject, html, true);
    console.log('✅ Test email sent successfully!');
    console.log('📬 Check your inbox (and spam folder) for the test email.\n');
  } catch (error) {
    console.error('❌ Failed to send test email:');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. EMAIL_USER and EMAIL_PASS in .env are correct');
    console.error('2. Gmail app password is generated (not regular password)');
    console.error('3. Less secure app access is enabled (if using regular password)');
    console.error('4. Internet connection is working\n');
  }
}

testEmail();