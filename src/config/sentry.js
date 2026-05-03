const Sentry = require('@sentry/node');

const initSentry = (app) => {
    if (process.env.SENTRY_DSN) {
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
        });
    }
};

// If Sentry isn't initialized, Handlers might not exist or work properly.
// Exporting mock middleware guarantees the app won't crash when calling them in app.use()
const safeHandlers = {
    requestHandler: () => (req, res, next) => next(),
    tracingHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err)
};

// Use real Sentry handlers if available, otherwise use safe mocks
const Handlers = Sentry.Handlers || safeHandlers;

// Attach Handlers to the Sentry object we export so app.js can do Sentry.Handlers.requestHandler()
Sentry.Handlers = Handlers;

module.exports = { initSentry, Sentry };
