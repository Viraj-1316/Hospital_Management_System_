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
            clinicId: payload.clinicId,
        },
        JWT_SECRET,
        { expiresIn }
    );
}


async function verifyToken(req, res, next) {
    try {
        let token;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.query.token) {
            // Fallback for file downloads where headers can't be set easily
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach basic user info to request
        req.user = decoded;
        
        // OPTIMIZATION: Fetch full user data once to avoid repeated DB lookups in routes
        // This data is cached in req.fullUser for routes that need it
        try {
            const cache = require('../utils/cache');
            const cacheKey = `user:${decoded.id}`;
            
            let fullUser = cache.get(cacheKey);
            
            if (!fullUser) {
                if (decoded.role === 'admin') {
                    const Admin = require('../models/Admin');
                    fullUser = await Admin.findById(decoded.id).select('-password').lean();
                } else {
                    const User = require('../models/User');
                    fullUser = await User.findById(decoded.id).select('-password').lean();
                }
                
                if (fullUser) {
                    // Cache for 5 minutes
                    cache.set(cacheKey, fullUser, 300);
                }
            }
            
            if (fullUser) {
                req.fullUser = fullUser;
                // Ensure clinicId is always available from the actual user record
                req.user.clinicId = fullUser.clinicId || decoded.clinicId;
            }
        } catch (cacheErr) {
            // Silent fail - routes will fall back to their own lookups
            // This keeps backward compatibility
        }
        
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired. Please login again." });
        }
        return res.status(401).json({ message: "Invalid token." });
    }
}


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
