const { check, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

const validateRegister = [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password must be at least 8 characters long')
        .isLength({ min: 8 })
        .matches(/[0-9]/, 'i').withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character (!@#$%^&*)'),
    validateRequest
];

const validateLogin = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists(),
    validateRequest
];

const validateInternship = [
    check('positionTitle', 'Position title is required').not().isEmpty().trim(),
    check('domain', 'Domain is required').not().isEmpty().trim(),
    check('duration', 'Duration is required').not().isEmpty(),
    check('expiryDate', 'Valid expiry date is required').isISO8601().toDate(),
    check('description', 'Description must be at least 20 characters').isLength({ min: 20 }),
    check('company').optional().trim(),
    check('minimumGPA', 'GPA must be between 0 and 4.0').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0, max: 4.0 }),
    validateRequest
];

const validateStudentProfile = [
    check('personalInfo.phone', 'Valid phone number is required').optional().isMobilePhone(),
    check('personalInfo.gpa', 'GPA must be roughly between 0 and 4.0').optional().isFloat({ min: 0, max: 4.3 }),
    check('personalInfo.location', 'Location is required').optional().trim().escape(),
    check('personalInfo.age', 'Age must be a whole number between 0 and 100').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0, max: 100 }),
    check('education.*.institution', 'Institution is required').optional().not().isEmpty().trim().escape(),
    validateRequest
];

module.exports = {
    validateRegister,
    validateLogin,
    validateInternship,
    validateStudentProfile
};
