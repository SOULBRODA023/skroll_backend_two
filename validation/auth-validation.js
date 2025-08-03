const { body, validationResult } = require("express-validator")

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    // Map errors to a more frontend-friendly format
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }))
    return res.status(400).json({ errors: formattedErrors })
  }
  next()
}

const signupValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters long."),
  body("email").trim().notEmpty().withMessage("Email is required.").isEmail().withMessage("Invalid email format."),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number.")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character."),
  handleValidationErrors,
]

const loginValidation = [
  body("email").trim().notEmpty().withMessage("Email is required.").isEmail().withMessage("Invalid email format."),
  body("password").notEmpty().withMessage("Password is required."),
  handleValidationErrors,
]

module.exports = {
  signupValidation,
  loginValidation,
  handleValidationErrors, // Export if you need to use it separately
}
