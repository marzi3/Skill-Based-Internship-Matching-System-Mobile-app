const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const RedisStore = require('connect-redis').default || require('connect-redis');
const redisClient = require('./config/redis');
const helmet = require('helmet');
const passport = require('./config/passport'); // Import passport config
const { globalLimiter } = require('./middleware/rateLimiter');
require('dotenv').config();

const { initSentry, Sentry } = require('./config/sentry');
const app = express();

// Initialize Sentry BEFORE any other middleware
initSentry(app);

// Sentry RequestHandler creates a separate execution context to track transactions
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// Middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
  }
  next();
});

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "frame-ancestors": [
        "'self'", 
        "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005",
        "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:3002", "http://127.0.0.1:3003", "http://127.0.0.1:3004", "http://127.0.0.1:3005"
      ],
    },
  },
}));

app.use(cors({
  origin: function (origin, callback) {
    const isLocalhost = origin && (
      origin.startsWith('http://localhost:3000') ||
      origin.startsWith('http://localhost:3001') ||
      origin.startsWith('http://localhost:3002') ||
      origin.startsWith('http://localhost:3003') ||
      origin.startsWith('http://localhost:3004') ||
      origin.startsWith('http://localhost:3005')
    );

    if (!origin || isLocalhost || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Apply global rate limiting (Moved after CORS to ensure 429 errors follow CORS policy)
app.use(globalLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies
// Configure session store
let sessionStore;
  // For development/debugging, we'll use MemoryStore to avoid Redis connection issues
  sessionStore = new session.MemoryStore();
  console.info('ℹ️ Using MemoryStore for sessions (Redis disabled)');

app.use(session({
  store: sessionStore,
  secret: process.env.JWT_SECRET, // Throws error later if missing due to previous configs
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));
app.use(passport.initialize()); // Init passport
app.use(passport.session()); // Passport session support

// Static Uploads Folder
app.use('/uploads', express.static('uploads'));

// Routes
const routes = require('./routes/index');
app.use('/api/v1', routes); // Use the index router which includes auth & verification

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Custom Error handler
const errorHandler = require('./middleware/errorMiddleware');
app.use(errorHandler);

module.exports = app;
