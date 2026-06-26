const jwt = require("jsonwebtoken");

function extractTokenFromCookies(req) {
  const token = req.cookies?.userToken;
  return token || null;
}

const auth = (req, res, next) => {
  // Prefer HttpOnly cookie
  let token = extractTokenFromCookies(req);

  // Fallback to Authorization header for backward compatibility
  if (!token) {
    const authHeader = req.headers.authorization || req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.AUTH_JWT_SECRET);
    req.user = decoded; // Attach user payload to the request
    next();
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

module.exports = auth;
