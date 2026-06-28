/**
 * Comprehensive test for email functionality
 * Tests: 1) SMTP connection, 2) Lost item submission, 3) Match notification
 */

require('dotenv').config();
const mongoose = require('mongoose');
const LostItem = require('./models/LostItem');
const Item = require('./models/FoundItem');
const { dispatchEmailJob, processPendingNotifications } = require('./utils/emailDispatcher');
const sendEmail = require('./utils/notifications');

async function testEmailFlow() {
  console.log('🧪 Starting comprehensive email test...\n');

  // Test 1: SMTP Connection
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 1: SMTP Connection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    await sendEmail(
      process.env.EMAIL_USER,
      'SMTP Test - EasyFind',
      '<h1>SMTP Test Successful!</h1><p>If you receive this, Gmail SMTP is working.</p>',
      true
    );
    console.log('✅ SMTP connection successful\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('\nPlease verify:');
    console.error('1. EMAIL_USER:', process.env.EMAIL_USER);
    console.error('2. EMAIL_PASS is a 16-character Gmail App Password');
    console.error('3. Get app password from: https://myaccount.google.com/apppasswords\n');
    process.exit(1);
  }

  // Test 2: Check database connection
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 2: Database Connection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }

  // Test 3: Check existing lost items
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 3: Check Lost Items in Database');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const lostItems = await LostItem.find({});
  console.log(`📋 Found ${lostItems.length} lost items in database`);
  if (lostItems.length > 0) {
    console.log('Sample lost items:');
    lostItems.slice(0, 3).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.itemName} (${item.category}) - ${item.email}`);
    });
  }
  console.log();

  // Test 4: Check existing found items
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test 4: Check Found Items in Database');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const foundItems = await Item.find({});
  console.log(`📦 Found ${foundItems.length} found items in database`);
  if (foundItems.length > 0) {
    console.log('Sample found items:');
    foundItems.slice(0, 3).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.itemName} (${item.category}) - Status: ${item.status}`);
    });
  }
  console.log();

  // Test 5: Create a test lost item if none exist
  if (lostItems.length === 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 5: Creating Test Lost Item');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const testLostItem = new LostItem({
      itemName: 'Test Laptop',
      category: 'Electronics',
      location: 'Library',
      email: process.env.EMAIL_USER,
      description: 'Black Dell laptop with stickers, last seen in library on 2nd floor'
    });
    await testLostItem.save();
    console.log(`✅ Created test lost item: ${testLostItem.itemName}\n`);
  }

  // Test 6: Create a test found item if none exist
  if (foundItems.length === 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 6: Creating Test Found Item');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const testFoundItem = new Item({
      itemName: 'Found Laptop',
      category: 'Electronics',
      description: 'Black Dell laptop found in cafeteria, has stickers on the back',
      foundLocation: 'Cafeteria',
      code: 'TEST1',
      status: 'verified',
      reporterRollNo: 'admin'
    });
    await testFoundItem.save();
    console.log(`✅ Created test found item: ${testFoundItem.itemName}`);
    console.log(`   Item ID: ${testFoundItem._id}\n`);

    // Test 7: Dispatch email job for the test found item
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 7: Dispatch Email Job');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await dispatchEmailJob('matchLostItem', { itemId: testFoundItem._id });
    console.log('✅ Email job dispatched\n');

    // Wait for immediate processing
    console.log('⏳ Waiting 3 seconds for immediate processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 8: Process pending notifications
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 8: Process Pending Notifications');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await processPendingNotifications();
    console.log();
  } else {
    // Test with existing found item
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 6: Test with Existing Found Item');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const verifiedItem = foundItems.find(item => item.status === 'verified') || foundItems[0];
    console.log(`Testing with: ${verifiedItem.itemName} (${verifiedItem.category})`);
    console.log(`Item ID: ${verifiedItem._id}\n`);

    await dispatchEmailJob('matchLostItem', { itemId: verifiedItem._id });
    console.log('✅ Email job dispatched\n');

    console.log('⏳ Waiting 3 seconds for immediate processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 7: Process Pending Notifications');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await processPendingNotifications();
    console.log();
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SMTP connection tested');
  console.log('✅ Database connection tested');
  console.log('✅ Lost items checked');
  console.log('✅ Found items checked');
  console.log('✅ Email dispatch tested');
  console.log('✅ Notification processing tested');
  console.log('\n📬 Check your email inbox (and spam folder) for match notifications!');
  console.log('💡 Tip: If no emails received, check server logs for matching details\n');

  await mongoose.disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
}

testEmailFlow().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});