/**
 * Generate HTML email for lost item match notification
 * @param {Object} lostItem - Lost item details
 * @param {Object} foundItem - Found item details
 * @returns {Object} - { subject, html }
 */
function getLostItemMatchEmail(lostItem, foundItem) {
  const subject = 'Match Found: Your Lost Item - EasyFind';
  
  const itemImage = foundItem.image
    ? foundItem.image
    : '';
  
  const itemCode = foundItem.code || '';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Item Match Found - EasyFind</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #fff;
      border: 1px solid #ddd;
      padding: 0;
    }
    .header {
      background: #2563eb;
      color: #fff;
      padding: 20px;
      font-size: 18px;
      font-weight: 600;
    }
    .content {
      padding: 30px 25px;
    }
    p {
      margin: 0 0 15px 0;
    }
    .item-image {
      width: 100%;
      max-width: 400px;
      height: auto;
      margin: 20px 0;
      display: block;
    }
    .details {
      background: #f9f9f9;
      padding: 15px;
      margin: 20px 0;
      border-left: 3px solid #34495e;
    }
    .details p {
      margin: 5px 0;
      font-size: 14px;
    }
    .code {
      font-family: monospace;
      background: #eee;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 13px;
    }
    .button {
      display: inline-block;
      background: #34495e;
      color: #fff;
      padding: 12px 25px;
      text-decoration: none;
      margin: 20px 0;
      border-radius: 3px;
    }
    .footer {
      padding: 20px 25px;
      border-top: 1px solid #eee;
      font-size: 13px;
      color: #666;
    }
    .note {
      background: #fffbf0;
      border-left: 3px solid #f0ad4e;
      padding: 12px;
      margin: 20px 0;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      📦 EasyFind Lost & Found
    </div>
    
    <div class="content">
      <p>Hello,</p>
      
      <p>Great news! We found an item that matches your lost item report. Please review the details below.</p>
      
      ${itemImage ? `<img src="${itemImage.url}" alt="Found item" class="item-image" />` : ''}
      
      <div class="details">
        <p><strong>${foundItem.itemName || 'Item'}</strong></p>
        <p><strong>Category:</strong> ${foundItem.category || 'N/A'}</p>
        <p><strong>Item Code:</strong> <span class="code">${itemCode}</span></p>
        <p><strong>Found Location:</strong> ${foundItem.foundLocation || 'N/A'}</p>
      </div>

      <a href="${process.env.FRONTEND_URL || 'https://easyfind.vjstartup.com'}/dashboard" class="button">View details</a>

      <div class="note">
        <p><strong>Not your item?</strong></p>
        <p>No problem! You can manage your lost item reports at <a href="${process.env.FRONTEND_URL || 'https://easyfind.vjstartup.com'}/my-lost-items">this link</a> to update or remove your report.</p>
      </div>

      <p>Thanks,<br>EasyFind Team</p>
    </div>

    <div class="footer">
      <p><strong>EasyFind Lost & Found System</strong></p>
      <p>VNR Vignana Jyothi Institute of Engineering & Technology</p>
      <p>Contact: <a href="mailto:security@vnrvjiet.in">security@vnrvjiet.in</a></p>
      <p style="margin-top: 10px; font-size: 11px; color: #999;">
        You received this email because you reported a lost item in our system.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Generate plain text version (fallback)
 * @param {Object} lostItem - Lost item details
 * @param {Object} foundItem - Found item details
 * @returns {string} - Plain text email
 */
function getLostItemMatchText(lostItem, foundItem) {
  const itemCode = foundItem.code || '';
  
  return `
Hello,

We found an item that matches your lost item report.

Item: ${foundItem.itemName || 'Found Item'}
Category: ${foundItem.category || 'N/A'}
Item code: ${itemCode}

View details: ${process.env.FRONTEND_URL || 'https://easyfind.vjstartup.com'}/dashboard/search-item

Not your item? Manage your reports at:
${process.env.FRONTEND_URL || 'https://easyfind.vjstartup.com'}/dashboard/lost-item

Thanks,
EasyFind Team

---
security@vnrvjiet.in
  `;
}

/**
 * Generate HTML email for lost item confirmation
 * @param {Object} lostItem - Lost item details
 * @returns {Object} - { subject, html }
 */
function getLostItemConfirmationEmail(lostItem) {
  const subject = 'Lost item reported successfully - EasyFind';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #fff;
      border: 1px solid #ddd;
      padding: 0;
    }
    .header {
      background: #34495e;
      color: #fff;
      padding: 20px;
      font-size: 18px;
      font-weight: normal;
    }
    .content {
      padding: 30px 25px;
    }
    p {
      margin: 0 0 15px 0;
    }
    .details {
      background: #f9f9f9;
      padding: 15px;
      margin: 20px 0;
      border-left: 3px solid #34495e;
    }
    .details p {
      margin: 5px 0;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: #34495e;
      color: #fff;
      padding: 12px 25px;
      text-decoration: none;
      margin: 20px 0;
      border-radius: 3px;
    }
    .footer {
      padding: 20px 25px;
      border-top: 1px solid #eee;
      font-size: 13px;
      color: #666;
    }
    .note {
      background: #e8f5e9;
      border-left: 3px solid #4caf50;
      padding: 12px;
      margin: 20px 0;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      EasyFind
    </div>
    
    <div class="content">
      <p>Hello,</p>
      
      <p>Your lost item has been reported successfully. We'll notify you via email if we find a matching item.</p>
      
      <div class="details">
        <p><strong>${lostItem.itemName || 'Item'}</strong></p>
        <p>Category: ${lostItem.category || 'N/A'}</p>
        <p>Location: ${lostItem.location || 'N/A'}</p>
        <p>Date Lost: ${lostItem.dateLost ? new Date(lostItem.dateLost).toLocaleDateString() : 'N/A'}</p>
      </div>

      <a href="${process.env.FRONTEND_URL || 'https://easyfind.vjrvjiet.com'}/dashboard/lost-item" class="button">View my lost items</a>

      <div class="note">
        <p><strong>What happens next?</strong></p>
        <p>Our system will automatically check new found items against your report. If a match is found, you'll receive an email notification immediately.</p>
      </div>

      <p>Thanks,<br>EasyFind Team</p>
    </div>

    <div class="footer">
      <p>EasyFind Lost & Found System</p>
      <p>Contact: security@vnrvjiet.in</p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Generate plain text version (fallback)
 * @param {Object} lostItem - Lost item details
 * @returns {string} - Plain text email
 */
function getLostItemConfirmationText(lostItem) {
  return `
Hello,

Your lost item has been reported successfully.

Item: ${lostItem.itemName || 'Item'}
Category: ${lostItem.category || 'N/A'}
Location: ${lostItem.location || 'N/A'}
Date Lost: ${lostItem.dateLost ? new Date(lostItem.dateLost).toLocaleDateString() : 'N/A'}

View your lost items: ${process.env.FRONTEND_URL || 'https://easyfind.vjrvjiet.com'}/dashboard/lost-item

We'll notify you via email if we find a matching item.

Thanks,
EasyFind Team

---
security@vnrvjiet.in
  `;
}

/**
 * Generate HTML email for QR code handover
 * @param {Object} claim - Claim details
 * @param {Object} qrCode - QR code details
 * @param {string} qrImage - Base64 QR image
 * @param {string} verificationURL - Verification URL
 * @returns {Object} - { subject, html }
 */
function getQRCodeEmail(claim, qrCode, qrImage, verificationURL) {
  const subject = 'Your QR Pass for Item Pickup - EasyFind';
  
  const expiryTime = new Date(qrCode.expiryTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>QR Pass for Item Pickup - EasyFind</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background: #fff;
      border: 1px solid #ddd;
      padding: 0;
    }
    .header {
      background: #2563eb;
      color: #fff;
      padding: 20px;
      font-size: 18px;
      font-weight: 600;
    }
    .content {
      padding: 30px 25px;
    }
    p {
      margin: 0 0 15px 0;
    }
    .qr-image {
      width: 100%;
      max-width: 300px;
      height: auto;
      margin: 20px auto;
      display: block;
      border: 2px solid #2563eb;
      padding: 10px;
      border-radius: 8px;
    }
    .details {
      background: #f9f9f9;
      padding: 15px;
      margin: 20px 0;
      border-left: 3px solid #2563eb;
    }
    .details p {
      margin: 5px 0;
      font-size: 14px;
    }
    .code {
      font-family: monospace;
      background: #eee;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 13px;
    }
    .button {
      display: inline-block;
      background: #2563eb;
      color: #fff;
      padding: 12px 25px;
      text-decoration: none;
      margin: 20px 0;
      border-radius: 3px;
    }
    .warning {
      background: #fff3cd;
      border-left: 3px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
      font-size: 13px;
    }
    .footer {
      padding: 20px 25px;
      border-top: 1px solid #eee;
      font-size: 13px;
      color: #666;
    }
    .instructions {
      background: #e8f5e9;
      border-left: 3px solid #4caf50;
      padding: 12px;
      margin: 20px 0;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      📱 Your QR Pass is Ready
    </div>
    
    <div class="content">
      <p>Hello,</p>
      
      <p>Great news! Your claim has been approved. Please find your QR pass below for item pickup.</p>
      
      <div class="details">
        <p><strong>Item:</strong> ${claim.itemName || 'Found Item'}</p>
        <p><strong>Category:</strong> ${claim.category || 'N/A'}</p>
        <p><strong>Item Code:</strong> <span class="code">${claim.code || 'N/A'}</span></p>
        <p><strong>Pickup Location:</strong> ${claim.handoverLocation || 'Security Office'}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p style="font-weight: 600; margin-bottom: 10px;">Your QR Pass:</p>
        <img src="${qrImage}" alt="QR Code" class="qr-image" />
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
          Show this QR code at the security office
        </p>
      </div>

      <div class="instructions">
        <p><strong>📋 Pickup Instructions:</strong></p>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li>Save or screenshot this QR code</li>
          <li>Visit the security office during working hours</li>
          <li>Show this QR code to the security staff</li>
          <li>Staff will scan the code to verify and hand over your item</li>
        </ol>
      </div>

      <div class="warning">
        <p><strong>⚠️ Important:</strong></p>
        <p>This QR code will expire on: <strong>${expiryTime}</strong></p>
        <p>After expiry, you'll need to contact the admin office for assistance.</p>
        <p style="margin-top: 10px;"><strong>Do not share this QR code with anyone.</strong></p>
      </div>

      <a href="${process.env.FRONTEND_URL || 'https://easyfind.vjstartup.com'}/my-qr-pass" class="button">View My QR Passes</a>

      <p>Thanks,<br>EasyFind Team</p>
    </div>

    <div class="footer">
      <p><strong>EasyFind Lost & Found System</strong></p>
      <p>VNR Vignana Jyothi Institute of Engineering & Technology</p>
      <p>Contact: <a href="mailto:security@vnrvjiet.in">security@vnrvjiet.in</a></p>
      <p style="margin-top: 10px; font-size: 11px; color: #999;">
        You received this email because you claimed a found item in our system.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Generate claim submitted confirmation email
 */
function getClaimSubmittedEmail(studentName, foundItem) {
  const subject = 'Claim Submitted - EasyFind';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #34495e; color: #fff; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .details { background: #fff; padding: 15px; margin: 20px 0; border-left: 3px solid #34495e; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="header">
    <h2>EasyFind Lost & Found</h2>
  </div>
  <div class="content">
    <p>Hello ${studentName},</p>
    <p>Your claim has been submitted successfully. Our admin team will review it shortly.</p>
    
    <div class="details">
      <h3>Claimed Item Details:</h3>
      <p><strong>Item:</strong> ${foundItem.itemName}</p>
      <p><strong>Category:</strong> ${foundItem.category}</p>
      <p><strong>Code:</strong> ${foundItem.code}</p>
      <p><strong>Found Location:</strong> ${foundItem.foundLocation}</p>
    </div>

    <p>You will receive an email notification once your claim is reviewed.</p>
    <p>You can track your claim status in "My Claims" section.</p>
  </div>
  <div class="footer">
    <p>EasyFind Team | security@vnrvjiet.in</p>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Generate claim approved email
 */
function getClaimApprovedEmail(studentName, foundItem, qrImage) {
  const subject = 'Claim Approved - Your QR Pass is Ready - EasyFind';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #27ae60; color: #fff; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .details { background: #fff; padding: 15px; margin: 20px 0; border-left: 3px solid #27ae60; }
    .qr-section { text-align: center; margin: 30px 0; }
    .qr-image { max-width: 300px; padding: 10px; background: #fff; border: 2px solid #27ae60; }
    .button { display: inline-block; background: #27ae60; color: #fff; padding: 12px 25px; text-decoration: none; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
    .instructions { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 3px solid #ffc107; }
  </style>
</head>
<body>
  <div class="header">
    <h2>🎉 Claim Approved!</h2>
  </div>
  <div class="content">
    <p>Hello ${studentName},</p>
    <p>Great news! Your claim has been approved. Please find your QR pass below for item pickup.</p>
    
    <div class="details">
      <h3>Item Details:</h3>
      <p><strong>Item:</strong> ${foundItem.itemName}</p>
      <p><strong>Category:</strong> ${foundItem.category}</p>
      <p><strong>Item Code:</strong> ${foundItem.code}</p>
      <p><strong>Found Location:</strong> ${foundItem.foundLocation}</p>
    </div>

    <div class="qr-section">
      <h3>Your QR Pass:</h3>
      <img src="${qrImage}" alt="QR Code" class="qr-image" />
      <p><strong>Show this QR code at the security office</strong></p>
    </div>

    <div class="instructions">
      <h4>📋 Pickup Instructions:</h4>
      <ol>
        <li>Save or screenshot this QR code</li>
        <li>Visit the security office during working hours</li>
        <li>Show this QR code to the security staff</li>
        <li>Staff will scan it to verify and hand over your item</li>
      </ol>
      <p><strong>Note:</strong> This QR code will expire in 24 hours.</p>
    </div>

    <a href="${process.env.FRONTEND_URL || 'http://localhost:3109'}/dashboard/my-qr-pass" class="button">View My QR Pass</a>
  </div>
  <div class="footer">
    <p>EasyFind Team | security@vnrvjiet.in</p>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * Generate claim rejected email
 */
function getClaimRejectedEmail(studentName, foundItem, reason) {
  const subject = 'Claim Update - EasyFind';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #e74c3c; color: #fff; padding: 20px; text-align: center; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .details { background: #fff; padding: 15px; margin: 20px 0; border-left: 3px solid #e74c3c; }
    .reason { background: #fff; padding: 15px; margin: 20px 0; border-left: 3px solid #f39c12; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Claim Update</h2>
  </div>
  <div class="content">
    <p>Hello ${studentName},</p>
    <p>We regret to inform you that your claim has been reviewed and could not be approved at this time.</p>
    
    <div class="details">
      <h3>Item Details:</h3>
      <p><strong>Item:</strong> ${foundItem.itemName}</p>
      <p><strong>Category:</strong> ${foundItem.category}</p>
      <p><strong>Code:</strong> ${foundItem.code}</p>
    </div>

    ${reason ? `
    <div class="reason">
      <h4>Reason:</h4>
      <p>${reason}</p>
    </div>
    ` : ''}

    <p>You can continue searching for other items or report a new lost item.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3109'}/dashboard/search-item" style="display: inline-block; background: #3498db; color: #fff; padding: 12px 25px; text-decoration: none; margin: 20px 0; border-radius: 5px;">Search Items</a>
  </div>
  <div class="footer">
    <p>EasyFind Team | security@vnrvjiet.in</p>
  </div>
</body>
</html>
  `;

  return { subject, html };
}

module.exports = {
  getLostItemMatchEmail,
  getLostItemMatchText,
  getLostItemConfirmationEmail,
  getLostItemConfirmationText,
  getQRCodeEmail,
  getClaimSubmittedEmail,
  getClaimApprovedEmail,
  getClaimRejectedEmail,
};
