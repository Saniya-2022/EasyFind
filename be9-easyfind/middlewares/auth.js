const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access Denied. No Token Provided" });

    const decoded= jwt.verify(token, process.env.JWT_SECRET); // Decode and store user info
    req.user=decoded.admin.id
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    res.status(401).json({ message: "Invalid or Expired Token",error:error,secret:process.env.JWT_SECRET });
  }
};

module.exports = auth;
