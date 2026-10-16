const {
    body,
    validationResult
} = require("express-validator");

/* RETURN VALIDATION ERRORS */

const handleValidationErrors = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed.",
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg
            }))
        });
    }

    next();
};


/* REGISTER VALIDATION */

const registerValidation = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required.")
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters."),

    body("email")
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email address.")
        .normalizeEmail(),

    body("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone number is required.")
        .isLength({ min: 7, max: 20 })
        .withMessage("Phone number must be between 7 and 20 characters."),

    body("address")
        .trim()
        .notEmpty()
        .withMessage("Address is required.")
        .isLength({ min: 5, max: 200 })
        .withMessage("Address must be between 5 and 200 characters."),

    body("buildingType")
        .trim()
        .notEmpty()
        .withMessage("Building type is required."),

    body("userType")
        .trim()
        .notEmpty()
        .withMessage("User type is required.")
        .isIn(["landlord", "tenant"])
        .withMessage("User type must be either landlord or tenant."),

    body("password")
        .isString()
        .withMessage("Password must be a string.")
        .isLength({ min: 8, max: 128 })
        .withMessage("Password must be between 8 and 128 characters.")

];


/* LOGIN VALIDATION */

const loginValidation = [

    body("email")
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email address.")
        .normalizeEmail(),

    body("password")
        .isString()
        .notEmpty()
        .withMessage("Password is required.")

];

/* PROFILE UPDATE VALIDATION */

const profileUpdateValidation = [
    body("name")
        .isString()
        .withMessage("Name must be a string.")
        .trim()
        .notEmpty()
        .withMessage("Name is required.")
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters."),


    body("phone")
        .isString()
        .withMessage("Phone number must be a string.")
        .bail()
        .trim()
        .isLength({ min: 7, max: 20 })
        .withMessage("Phone number must be between 7 and 20 characters.")
        .bail()
        .custom((value) => {
            const digits = value.replace(/\D/g, "");
            return digits.length >= 10 && digits.length <= 15;
        })
        .withMessage("Phone number must contain between 10 and 15 digits."),

    body("address")
        .isString()
        .withMessage("Address must be a string.")
        .trim()
        .notEmpty()
        .withMessage("Address is required.")
        .isLength({ min: 5, max: 200 })
        .withMessage("Address must be between 5 and 200 characters."),

    body("buildingType")
        .isString()
        .withMessage("Building type must be a string.")
        .trim()
        .notEmpty()
        .withMessage("Building type is required.")
        .isIn([
            "flat",
            "duplex",
            "bungalow",
            "self-contained",
            "compound",
            "other"
        ])
        .withMessage("Please select a valid building type.")
];

module.exports = {
    registerValidation,
    loginValidation,
    profileUpdateValidation,
    handleValidationErrors
};
