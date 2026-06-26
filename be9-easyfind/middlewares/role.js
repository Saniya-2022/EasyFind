exports.isSecurityOffice = (req, res, next) => {
    if (req.user.role !== "security-office") {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };