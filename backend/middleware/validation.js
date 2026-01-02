/**
 * Input Validation Middleware
 * Uses express-validator for sanitization and validation
 */
const { body, validationResult } = require('express-validator');

// Helper to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation Failed:", JSON.stringify(errors.array(), null, 2)); // Debug log
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Login validation rules
const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .trim(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 1 })
        .withMessage('Password cannot be empty'),
    handleValidationErrors
];

// Signup validation rules
const signupValidation = [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .trim()
        .escape()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .trim(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/\d/)
        .withMessage('Password must contain at least one number'),
    body('phone')
        .optional()
        .trim()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
    body('role')
        .optional()
        .isIn(['patient', 'doctor', 'receptionist'])
        .withMessage('Invalid role specified'),
    handleValidationErrors
];

// Change password validation rules
const changePasswordValidation = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .trim(),
    body('oldPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .custom((value, { req }) => {
            if (value === req.body.oldPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        }),
    handleValidationErrors
];

// Patient profile validation
const patientProfileValidation = [
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .trim()
        .escape()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('phone')
        .optional()
        .trim(),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
    handleValidationErrors
];

// Appointment validation
const appointmentValidation = [
    body('date')
        .notEmpty()
        .withMessage('Appointment date is required'),
    body('time')
        .optional(),
    body('doctorId')
        .optional()
        .isMongoId()
        .withMessage('Invalid doctor ID'),
    body('patientId')
        .optional()
        .isMongoId()
        .withMessage('Invalid patient ID'),
    body('patientName')
        .optional()
        .trim()
        .escape(),
    body('patientEmail')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid patient email')
        .normalizeEmail(),
    handleValidationErrors
];

// Sanitize MongoDB ObjectId
const mongoIdValidation = (paramName) => [
    body(paramName)
        .optional()
        .isMongoId()
        .withMessage(`Invalid ${paramName} format`),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    loginValidation,
    signupValidation,
    changePasswordValidation,
    patientProfileValidation,
    appointmentValidation,
    mongoIdValidation
};
