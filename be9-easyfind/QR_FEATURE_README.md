# QR-Based Secure Item Handover System

## Overview
A secure QR-based workflow for item handover that ensures only authorized claimants can collect their items from the security office.

## Features Implemented

### Backend (be9-easyfind)
1. **QRCode Model** - MongoDB schema for storing QR code data
2. **QR Service** - Business logic for QR generation, verification, and expiry
3. **QR Routes** - REST API endpoints for QR operations
4. **QR Scheduler** - Cron job for automatic QR expiry (every hour)
5. **Email Integration** - QR codes sent via email to claimants
6. **Automatic Integration** - QR generation triggered on handover

### Frontend - Child App (fe9-easyfind-child)
1. **My QR Pass Page** - Users can view and download their QR passes

### Frontend - Admin App (fe9-easyfind-admin)
1. **Pending Handovers Page** - Admin can view all pending handovers
2. **QR Scanner Page** - Admin can scan QR codes using webcam or manual entry

## Architecture

### Database Schema (QRCode)
```javascript
{
  claimId: ObjectId (ref: FoundItem),
  itemId: ObjectId (ref: FoundItem),
  userId: ObjectId (ref: User),
  token: String (unique, 64 chars),
  status: String (ACTIVE/USED/EXPIRED),
  generatedAt: Date,
  expiryTime: Date (24 hours from generation),
  usedAt: Date,
  usedBy: ObjectId (ref: Admin),
  verificationAttempts: Number,
  lastVerificationAttempt: Date
}
```

## API Endpoints

### 1. Generate QR Code
```http
POST /api/qr/generate/:claimId
Authorization: Bearer {admin_token}
```
**Response:**
```json
{
  "message": "QR code generated successfully",
  "qrCode": { "token": "...", "expiryTime": "..." },
  "qrImage": "data:image/png;base64,...",
  "verificationURL": "http://localhost:3115/api/qr/verify/{token}"
}
```

### 2. Verify QR Code (Public)
```http
GET /api/qr/verify/:token
```
**Response (Valid):**
```json
{
  "valid": true,
  "message": "QR code is valid",
  "item": {
    "name": "Found Laptop",
    "category": "Electronics",
    "code": "ABC123",
    "claimerName": "John Doe",
    "claimerRollNo": "25075A0521"
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "message": "This QR code has expired."
}
```

### 3. Scan & Mark as Used (Admin)
```http
POST /api/qr/scan
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "token": "abc123..."
}
```
**Response:**
```json
{
  "message": "QR code verified and item handed over successfully",
  "qrCode": { "status": "USED", "usedAt": "..." },
  "item": { "name": "...", "code": "...", "category": "..." }
}
```

### 4. Get User's QR Passes
```http
GET /api/qr/my-qr-passes
Authorization: Bearer {user_token}
```

### 5. Get Pending Handovers (Admin)
```http
GET /api/qr/pending-handovers
Authorization: Bearer {admin_token}
```

### 6. Get QR Image
```http
GET /api/qr/:id/image
Authorization: Bearer {token}
```
Returns PNG image directly.

## Workflow

### 1. Claim Approval & QR Generation
```
Admin approves claim (status: "claimed")
    ↓
System automatically generates QR code
    ↓
QR code emailed to claimant
    ↓
QR expires in 24 hours
```

### 2. Item Pickup
```
User arrives at security office
    ↓
Shows QR code (phone/screenshot)
    ↓
Admin scans QR code (webcam or manual)
    ↓
System verifies:
  - Token exists
  - Status is ACTIVE
  - Not expired
  - Valid claim
    ↓
If valid:
  - QR marked as USED
  - Item status → "handed_over"
  - Success message shown
    ↓
Item handed to user
```

### 3. QR Expiry
```
Every hour:
  - Cron job runs
  - Finds all ACTIVE QR codes past expiry
  - Marks them as EXPIRED
```

## Installation

### Backend
```bash
cd be9-easyfind
npm install
```

Dependencies added:
- `qrcode` - QR code generation

### Frontend (Admin)
```bash
cd fe9-easyfind-admin
npm install
```

Dependencies added:
- `html5-qrcode` - QR code scanning via webcam

## Configuration

### Environment Variables (.env)
```env
# No new environment variables required
# Uses existing:
# - BACKEND_URL (for QR verification URLs)
# - EMAIL_USER (for sending QR codes)
# - EMAIL_PASS (for sending QR codes)
```

## Usage

### For Users (Child App)
1. Navigate to `/dashboard/my-qr-pass`
2. View all QR passes
3. Download QR codes
4. Show QR code at security office

### For Admins
1. Navigate to `/admin/handovers`
2. View all pending handovers
3. Click "View QR" to see QR code
4. Click "Scan QR" to open scanner
5. Scan or manually enter token
6. Click "Verify & Complete Handover"

## Security Features

1. **Secure Token Generation**
   - Uses `crypto.randomBytes(32)` for 64-character hex tokens
   - Tokens are unpredictable and unique

2. **No Sensitive Data in QR**
   - QR contains only verification URL with token
   - No MongoDB IDs or user information exposed

3. **Time-based Expiry**
   - QR codes expire after 24 hours
   - Automatic expiry via cron job

4. **Status Validation**
   - ACTIVE: Can be used
   - USED: Cannot be reused
   - EXPIRED: Past expiry time

5. **Access Control**
   - Users can only view their own QR codes
   - Only admins can scan and mark as used
   - JWT authentication on all endpoints

6. **Audit Trail**
   - Tracks verification attempts
   - Records who scanned (usedBy)
   - Timestamps for all actions

## Email Template

When QR code is generated, claimant receives:
- QR code image (embedded in email)
- Item details (name, category, code)
- Pickup location
- Expiry time
- Instructions for pickup
- Link to "My QR Pass" page

## Error Handling

### Invalid QR Code
```json
{
  "valid": false,
  "message": "Invalid QR code. This code does not exist in our system."
}
```

### Already Used
```json
{
  "valid": false,
  "message": "This QR code has already been used.",
  "usedAt": "2024-01-15T10:30:00Z"
}
```

### Expired
```json
{
  "valid": false,
  "message": "This QR code has expired.",
  "expiredAt": "2024-01-15T10:30:00Z"
}
```

## Testing

### Test QR Generation
```bash
# Start backend
cd be9-easyfind
npm start

# In another terminal, test QR generation
curl -X POST http://localhost:3115/api/qr/generate/{claimId} \
  -H "Authorization: Bearer {admin_token}"
```

### Test QR Verification
```bash
# Verify QR code
curl http://localhost:3115/api/qr/verify/{token}
```

### Test QR Scan
```bash
# Scan and mark as used
curl -X POST http://localhost:3115/api/qr/scan \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"token": "{token}"}'
```

## Files Created/Modified

### Backend Files Created
- `be9-easyfind/models/QRCode.js` - MongoDB model
- `be9-easyfind/utils/qrService.js` - QR business logic
- `be9-easyfind/utils/qrScheduler.js` - Cron job for expiry
- `be9-easyfind/routes/qr.route.js` - API routes

### Backend Files Modified
- `be9-easyfind/server.js` - Added QR routes and scheduler
- `be9-easyfind/routes/admin.route.js` - Integrated QR generation with handover
- `be9-easyfind/utils/emailTemplates.js` - Added QR email template
- `be9-easyfind/package.json` - Added `qrcode` dependency

### Frontend Files Created
- `fe9-easyfind-child/src/components/MyQRPass.jsx` - User QR pass page
- `fe9-easyfind-admin/src/components/PendingHandovers.jsx` - Admin handovers page
- `fe9-easyfind-admin/src/components/QRScanner.jsx` - QR scanner component

### Frontend Files Modified
- `fe9-easyfind-child/src/App/App.jsx` - Added MyQRPass route
- `fe9-easyfind-admin/src/App.jsx` - Added PendingHandovers and QRScanner routes

## Troubleshooting

### QR Code Not Generating
- Check that item status is "claimed"
- Verify email service is working
- Check server logs for errors

### QR Code Not Scanning
- Ensure good lighting
- QR code must be flat and fully visible
- Try manual token entry as fallback

### QR Code Expired
- QR codes expire after 24 hours
- Admin must regenerate if expired
- Check expiry time in Pending Handovers page

### Email Not Received
- Check spam folder
- Verify email configuration in .env
- Test with `node test-email-flow.js`

## Future Enhancements

1. **QR Code History** - View all QR codes (used/expired)
2. **Bulk QR Generation** - Generate multiple QR codes at once
3. **QR Code Analytics** - Track scan times, pickup times
4. **SMS Notifications** - Send QR codes via SMS
5. **Mobile App** - Native mobile app for QR scanning
6. **Biometric Verification** - Add fingerprint/Face ID at pickup
7. **Multi-language Support** - Email templates in multiple languages
8. **QR Code Customization** - Add logo, custom colors

## Notes

- QR codes are single-use only
- Tokens are cryptographically secure
- All QR operations are logged
- Automatic expiry prevents stale QR codes
- Integration with existing handover workflow is seamless

## Support

For issues or questions:
1. Check server logs
2. Verify MongoDB connection
3. Test email service
4. Ensure all dependencies are installed
5. Check browser console for frontend errors