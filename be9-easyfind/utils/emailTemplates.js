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

module.exports = {
  getLostItemMatchEmail,
  getLostItemMatchText,
  getLostItemConfirmationEmail,
  getLostItemConfirmationText,
};
