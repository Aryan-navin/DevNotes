const required = ["MONGODB_URI", "JWT_SECRET", "CLIENT_ORIGIN"];
function validateEnv() {
  for (const key of required) if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
  if (process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET should be at least 32 characters long.");
  if (process.env.NODE_ENV === "production" && !String(process.env.CLIENT_ORIGIN).startsWith("https://")) throw new Error("Production CLIENT_ORIGIN must use HTTPS.");
}
module.exports = validateEnv;
