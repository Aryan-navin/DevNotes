const path = require("node:path");
const dns = require("node:dns");
require("dotenv").config();
if (process.env.FORCE_PUBLIC_DNS === "true") dns.setServers(["8.8.8.8", "1.1.1.1"]);
const express=require("express"); const cors=require("cors"); const helmet=require("helmet"); const cookieParser=require("cookie-parser"); const rateLimit=require("express-rate-limit");
const connectDB=require("./config/db"); const validateEnv=require("./config/env"); const authRoutes=require("./routes/auth.routes"); const noteRoutes=require("./routes/notes.routes"); const userRoutes=require("./routes/user.routes"); const {notFound,errorHandler}=require("./middleware/error.middleware");
validateEnv();
const app=express(); const PORT=Number(process.env.PORT||5000);
const HOST=process.env.HOST||"0.0.0.0"; const production=process.env.NODE_ENV==="production";
app.disable("x-powered-by"); if(production) app.set("trust proxy",1);
const configuredOrigins = [process.env.CLIENT_ORIGIN, process.env.RESET_PASSWORD_ORIGIN, `http://127.0.0.1:${PORT}`, `http://localhost:${PORT}`].filter(Boolean);
const allowedOrigins=[...new Set(configuredOrigins.flatMap(value=>String(value).split(",").map(x=>x.trim()).filter(Boolean)))];
const cspConnect = production
  ? ["'self'", "https:"]
  : ["'self'", "http://127.0.0.1:5000", "http://localhost:5000", "http://127.0.0.1:5500", "http://localhost:5500"];
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "no-referrer" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://unpkg.com"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: cspConnect,
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    }
  }
}));
app.use(cors({origin:(origin,cb)=>{if(!origin||allowedOrigins.includes(origin)) return cb(null,true); return cb(new Error("CORS origin not allowed"));},credentials:true}));
app.use(express.json({limit:"1mb"})); app.use(express.urlencoded({extended:false,limit:"100kb"})); app.use(cookieParser());

// Cookie-authenticated state changes must originate from a configured frontend.
// This is an additional CSRF defense for deployments using SameSite=None cookies.
app.use((req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin || !allowedOrigins.includes(origin)) return res.status(403).json({ message: "Request origin is not allowed." });
  next();
});

// Serve the DevNotes frontend from the same server too. This makes password-reset
// links work even when CLIENT_ORIGIN points to port 5000. Live Server on port 5500
// can still be used during development.
const clientPath = path.join(__dirname, "../client");
app.use(express.static(clientPath, {
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
    else res.setHeader("Cache-Control", "public, max-age=3600");
  }
}));

// Explicit frontend routes used by password-reset emails.
// These routes make the reset page work even if static-file routing is affected by hosting setup.
app.get("/reset-password.html", (req, res) => {
  res.sendFile(path.join(clientPath, "reset-password.html"));
});
app.get("/forgot-password.html", (req, res) => {
  res.sendFile(path.join(clientPath, "forgot-password.html"));
});
app.get("/", (req, res) => res.sendFile(path.join(clientPath, "index.html")));
const authLimiter=rateLimit({windowMs:15*60*1000,limit:50,standardHeaders:"draft-8",legacyHeaders:false,message:{message:"Too many authentication attempts. Please try again later."}});
const apiLimiter=rateLimit({windowMs:60*1000,limit:240,standardHeaders:"draft-8",legacyHeaders:false,message:{message:"Too many requests. Please slow down and try again."}});
app.get("/api/health",(req,res)=>res.json({ok:true,service:"devnotes-api",time:new Date().toISOString()}));
app.use("/api/auth",authLimiter,authRoutes); app.use("/api/notes",apiLimiter,noteRoutes); app.use("/api/users",apiLimiter,userRoutes);
app.use(notFound); app.use(errorHandler);
connectDB().then(() => {
  const server = app.listen(PORT, HOST, () => console.log(`DevNotes API listening on ${HOST}:${PORT}`));
  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down DevNotes…`);
    server.close(() => {
      const mongoose = require("mongoose");
      mongoose.connection.close(false).finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}).catch(err=>{console.error("Startup failed:",err.message);process.exit(1);});
