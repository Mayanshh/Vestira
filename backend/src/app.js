const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// Dynamic CORS configuration for Replit environment
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'https://vestira.onrender.com/'
  ];
  
  // Allow any Replit domain
  if (process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS) {
    origins.push(/\.replit\.dev$/);
    origins.push(/\.replit\.app$/);
    origins.push(/\.replit\.co$/);
  }
  
  return origins;
};

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = getAllowedOrigins();
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed || origin.includes('replit')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  optionsSuccessStatus: 200
}));

// Request timeout middleware
app.use((req, res, next) => {
  // Set longer timeout for upload routes
  const timeout = req.url.includes('/upload') ? 120000 : 30000; // 2 minutes for uploads, 30 seconds for others
  
  req.setTimeout(timeout);
  res.setTimeout(timeout);
  
  next();
});

// Handle request abortion gracefully
app.use((req, res, next) => {
  req.on('aborted', () => {
    console.log('Request aborted by client');
  });
  
  res.on('close', () => {
    if (!res.finished) {
      console.log('Response closed before completion');
    }
  });
  
  next();
});

app.use(express.json({ limit: "50mb" })); // handle JSON & base64 video
app.use(express.urlencoded({ limit: "50mb", extended: true })); // handle form data
app.use(cookieParser());

// Routes
const authRoutes = require("./routes/auth.routes");
const reelRoutes = require("./routes/reel.routes");
const orderRoutes = require("./routes/order.routes");
const userRoutes = require("./routes/user.routes");
const partnerRoutes = require("./routes/partner.routes");

app.use("/api/user", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/partner", partnerRoutes);

// Serve static files from React build (only in production)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  
  // Catch all handler: send back React's index.html file for any non-API routes
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
  });
}

module.exports = app;
