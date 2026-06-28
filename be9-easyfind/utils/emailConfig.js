/**
 * Email Configuration Manager
 * Supports multiple email providers: Gmail, Outlook, Yahoo, etc.
 */

require('dotenv').config();

const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

const emailConfigs = {
  gmail: {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Should be 16-character App Password
    },
    // Gmail-specific settings
    tls: {
      rejectUnauthorized: false,
    },
  },

  outlook: {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
    },
  },

  yahoo: {
    service: 'yahoo',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },

  // Generic SMTP configuration
  custom: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
};

function getEmailConfig() {
  const config = emailConfigs[emailProvider] || emailConfigs.gmail;
  
  console.log('📧 Email Configuration:');
  console.log(`   Provider: ${emailProvider}`);
  console.log(`   User: ${config.auth.user}`);
  console.log(`   Pass: ${config.auth.pass ? '***' + config.auth.pass.slice(-4) : 'NOT SET'}`);
  
  return config;
}

function validateEmailConfig() {
  const errors = [];
  
  if (!process.env.EMAIL_USER) {
    errors.push('EMAIL_USER is not set in .env');
  }
  
  if (!process.env.EMAIL_PASS) {
    errors.push('EMAIL_PASS is not set in .env');
  }
  
  if (emailProvider === 'gmail' && process.env.EMAIL_PASS) {
    const pass = process.env.EMAIL_PASS.replace(/\s/g, '');
    if (pass.length !== 16) {
      errors.push(`Gmail App Password should be 16 characters (current: ${pass.length})`);
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Email Configuration Errors:');
    errors.forEach(err => console.error(`   - ${err}`));
    return false;
  }
  
  return true;
}

module.exports = {
  getEmailConfig,
  validateEmailConfig,
  emailProvider,
};