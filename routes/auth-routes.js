const express = require("express")
const passport = require("passport")
const { signup, login, googleAuthCallback } = require("../controller/auth-controller")
const { signupValidation, loginValidation } = require("../validation/auth-validation")

const router = express.Router()

// Local Signup Route
router.post("/signup", signupValidation, signup)

// Local Login Route
router.post("/login", loginValidation, login)

// Google OAuth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: true }), // Ensure session is true
  googleAuthCallback,
)

module.exports = router
