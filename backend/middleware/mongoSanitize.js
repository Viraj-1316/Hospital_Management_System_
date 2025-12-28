/**
 * Custom MongoDB Sanitization Middleware
 * 
 * Prevents NoSQL injection by removing keys starting with '$' 
 * from req.body, req.query, and req.params.
 * 
 * Replaces express-mongo-sanitize to avoid "Cannot set property query" errors
 * by modifying objects in-place instead of reassigning them.
 */

const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
        for (const key in obj) {
            if (/^\$/.test(key)) {
                // Remove key starting with $
                delete obj[key];
            } else {
                // Recurse
                sanitize(obj[key]);
            }
        }
    }
};

const mongoSanitize = () => {
    return (req, res, next) => {
        if (req.body) sanitize(req.body);
        if (req.params) sanitize(req.params);
        if (req.query) sanitize(req.query);
        next();
    };
};

module.exports = mongoSanitize;
