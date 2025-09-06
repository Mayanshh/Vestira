const isPartner = (req, res, next) => {
  if (req.role !== "partner") {
    return res.status(403).json({ message: "Access denied: Partner only" });
  }
  next();
};

module.exports = isPartner;