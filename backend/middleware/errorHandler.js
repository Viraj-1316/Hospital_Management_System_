/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns consistent error response
 */

const logger = require("../utils/logger");

/**
 * Error handler middleware - must be registered LAST in Express app
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
    // Log error details for debugging
    logger.error("Unhandled error:", {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        user: req.user?.id || "anonymous"
    });

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            message: "Validation error",
            errors: messages
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        return res.status(409).json({
            message: `Duplicate value for ${field}. This ${field} already exists.`
        });
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === "CastError" && err.kind === "ObjectId") {
        return res.status(400).json({
            message: "Invalid ID format"
        });
    }

    // JWT errors (in case they slip through verifyToken)
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            message: "Invalid token"
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            message: "Token expired"
        });
    }

    // Default to 500 Internal Server Error
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message;

    res.status(statusCode).json({
        message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
    });
}

/**
 * Async handler wrapper - catches async errors and forwards to error handler
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped route handler
 * @example router.get("/", asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Not found handler - for 404 errors
 */
function notFoundHandler(req, res, next) {
    res.status(404).json({
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
}

module.exports = {
    errorHandler,
    asyncHandler,
    notFoundHandler
};
