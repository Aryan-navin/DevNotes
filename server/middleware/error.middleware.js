function notFound(req, res) { res.status(404).json({ message: "Route not found." }); }
function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  if (err.name === "ValidationError") return res.status(400).json({ message:"Validation failed.", errors:Object.values(err.errors).map(e=>e.message) });
  if (err.code === 11000) return res.status(409).json({ message:"A record with that value already exists." });
  if (err.message === "CORS origin not allowed") return res.status(403).json({ message:"Origin is not allowed." });
  const production = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({ message: production ? "Internal server error." : (err.message || "Internal server error.") });
}
module.exports={notFound,errorHandler};
