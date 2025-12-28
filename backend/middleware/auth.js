// middleware/auth.js
const jwt = require("jsonwebtoken");

// JWT Secret from environment variable - REQUIRED
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL: JWT_SECRET environment variable is not set!");
    console.error("Please add JWT_SECRET to your .env file");
    process.exit(1);
}

/**
 * Generate JWT token for authenticated user
 * @param {object} payload - User data to encode (id, email, role)
 * @param {string} expiresIn - Token expiration time (default: 24h)
 * @returns {string} JWT token
 */
function generateToken(payload, expiresIn = "24h") {
    return jwt.sign(
        {
            id: payload.id,
            email: payload.email,
            role: payload.role,
        },
        JWT_SECRET,
        { expiresIn }
    );
}

/**
 * Middleware to verify JWT token in request headers
 * Expects: Authorization: Bearer <token>
 */
function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired. Please login again." });
        }
        return res.status(401).json({ message: "Invalid token." });
    }
}

/**
 * Optional token verification - doesn't block if no token
 * Useful for routes that work both authenticated and unauthenticated
 */
function optionalToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }
        next();
    } catch (err) {
        // Token invalid but that's okay for optional
        next();
    }
}

/**
 * Role-based authorization middleware factory
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {function} Express middleware
 * @example router.get("/admin-only", verifyToken, requireRole("admin"), handler);
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required." });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${allowedRoles.join(" or ")}.`
            });
        }

        next();
    };
}

/**
 * Admin-only middleware (shorthand for requireRole("admin"))
 */
function adminOnly(req, res, next) {
    return requireRole("admin")(req, res, next);
}

/**
 * Doctor or Admin middleware
 */
function doctorOrAdmin(req, res, next) {
    return requireRole("admin", "doctor")(req, res, next);
}

module.exports = {
    generateToken,
    verifyToken,
    optionalToken,
    requireRole,
    adminOnly,
    doctorOrAdmin,
    JWT_SECRET,
};
