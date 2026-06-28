# Email Setup Guide for EasyFind

## Current Issue
Gmail SMTP authentication is failing with error: `535-5.7.8 Username and Password not accepted`

## Solution Options

### Option 1: Fix Gmail App Password (Recommended for Production)

1. **Go to Google Account Security**: https://myaccount.google.com/apppasswords

2. **Generate a new App Password**:
   - Click "Select app" → Choose "Mail"
   - Click "Select device" → Choose "Other (Custom name)"
   - Type "EasyFind" and click "Generate"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update your `.env` file**:
   ```env
   EMAIL_USER=saniyanewone@gmail.com
   EMAIL_PASS=abcdefghijklmnop  # Remove spaces, use exactly 16 chars
   ```

4. **Important**: Make sure 2-Step Verification is enabled on your Google Account

### Option 2: Enable Less Secure Apps (Not Recommended)

If you don't want to use App Passwords:

1. Go to: https://myaccount.google.com/lesssecureapps
2. Enable "Allow less secure apps"
3. Use your regular Gmail password in `.env`

**Note**: This is less secure and Google may disable this option in the future.

### Option 3: Use Ethereal Email for Testing

Ethereal Email is a fake SMTP service for testing. No real emails are sent, but you can see them in a web interface.

1. **Create Ethereal account**: https://ethereal.email/create
2. **Update `.env`**:
   ```env
   EMAIL_PROVIDER=ethereal
   EMAIL_USER=your-ethereal-username
   EMAIL_PASS=your-ethereal-password
   ```

3. **Install Ethereal transport**:
   ```bash
   cd be9-easyfind
   npm install nodemailer-ethereal-transport
   ```

### Option 4: Use Outlook/Hotmail

If you have an Outlook account:

1. **Update `.env`**:
   ```env
   EMAIL_PROVIDER=outlook
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASS=your-password
   ```

### Option 5: Use Custom SMTP Server

For production, use a dedicated email service:

**SendGrid**:
```env
EMAIL_PROVIDER=custom
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

**Mailgun**:
```env
EMAIL_PROVIDER=custom
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-domain@mg.yourdomain.com
EMAIL_PASS=your-mailgun-password
```

## Quick Test

After updating your `.env`, test with:

```bash
cd be9-easyfind
node test-email-flow.js
```

## Troubleshooting

1. **Check `.env` file is in the right location**: `be9-easyfind/.env`
2. **Restart the server** after changing `.env`
3. **Check spam folder** - emails might be marked as spam
4. **Verify app password** - make sure there are no spaces in the 16-character password
5. **Check Gmail security alerts** - Google might block the sign-in attempt

## Current Configuration

Check your current settings:
```bash
cd be9-easyfind
node -e "require('dotenv').config(); console.log('User:', process.env.EMAIL_USER); console.log('Pass length:', process.env.EMAIL_PASS?.length);"