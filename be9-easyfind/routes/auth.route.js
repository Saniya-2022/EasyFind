const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || "supersecret";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const verifyGoogleIdToken = async (token) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

const createJwtToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token || token === "null") {
      return null;
    }
    return token;
  }
  return null;
};

router.post("/user/login", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Missing Google token" });
  }

  try {
    const payload = await verifyGoogleIdToken(token);
    const email = payload.email;
    const emailDomain = email?.split("@")[1] || "";

    // TODO: Re-enable this check after testing
    // if (emailDomain !== "vnrvjiet.in") {
    //   return res.status(403).json({ error: "Access restricted to vnrvjiet.in domain only" });
    // }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        name: payload.name,
        email,
        avatar: payload.picture,
      });
    }

    const authToken = createJwtToken(user);
    return res.json({ logged_in: true, user, token: authToken });
  } catch (err) {
    console.error("User login failed:", err);
    return res.status(401).json({ error: "Invalid Google token" });
  }
});

router.get("/user/check-auth", async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ logged_in: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ logged_in: false });
    }
    return res.json({ logged_in: true, user });
  } catch (err) {
    console.error("Check auth failed:", err);
    return res.status(401).json({ logged_in: false });
  }
});

router.post("/user/logout", async (req, res) => {
  return res.json({ ok: true });
});

router.post("/admin/login", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Missing Google token" });
  }

  try {
    const payload = await verifyGoogleIdToken(token);
    const email = payload.email;
    const emailDomain = email?.split("@")[1] || "";

    // TODO: Re-enable this check after testing
    // if (emailDomain !== "vnrvjiet.in") {
    //   return res.status(403).json({ error: "Access restricted to vnrvjiet.in domain only" });
    // }

    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({ error: "Not authorized as admin" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        name: payload.name,
        email,
        avatar: payload.picture,
        role: "security-office",
      });
    }

    const authToken = createJwtToken(user);
    return res.json({ logged_in: true, user, token: authToken });
  } catch (err) {
    console.error("Admin login failed:", err);
    return res.status(401).json({ error: "Invalid Google token" });
  }
});

router.get("/admin/check-auth", async (req, res) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ logged_in: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return res.status(401).json({ logged_in: false });
    }
    return res.json({ logged_in: true, user });
  } catch (err) {
    console.error("Admin check auth failed:", err);
    return res.status(401).json({ logged_in: false });
  }
});

module.exports = router;
