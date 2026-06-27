// middleware/auth.js
const jwt = require('jsonwebtoken');

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

module.exports = function (req, res, next) {
  // Prefer cookie, fallback to Authorization header
  let token = req.cookies?.userToken || null;
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET);
    console.log("✅ Decoded admin data:", decoded);

    const email = decoded.email?.toLowerCase();
    const adminEmailsLower = ADMIN_EMAILS.map(e => e.toLowerCase());
    if (!email || !adminEmailsLower.includes(email)) {
      return res.status(403).json({ msg: 'Forbidden: Email not authorized' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
