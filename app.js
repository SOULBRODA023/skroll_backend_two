const express = require("express")
const session = require("express-session")
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const GoogleStrategy = require("passport-google-oauth20").Strategy
const bcrypt = require("bcrypt")
const db = require("./db")
const authRoutes = require("./routes/auth-routes")

// Load environment variables
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(express.json()) // For parsing application/json
app.use(express.urlencoded({ extended: true })) // For parsing application/x-www-form-urlencoded

// Session middleware
app.use(
  session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
	  maxAge: 1000 * 60 * 60 * 24, // 1 day
	},
  }),
)

// Passport.js initialization
app.use(passport.initialize())
app.use(passport.session())

// Passport Local Strategy (for email/password login)
passport.use(
  new LocalStrategy(
	{ usernameField: "email" }, // Use 'email' as the username field
	async (email, password, done) => {
	  try {
		const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email])
		const user = userResult.rows[0]

		if (!user) {
		  return done(null, false, { message: "Incorrect email or password." })
		}

		// If user has a password (not a Google-only user)
		if (user.password) {
		  const isMatch = await bcrypt.compare(password, user.password)
		  if (!isMatch) {
			return done(null, false, { message: "Incorrect email or password." })
		  }
		} else {
		  // User exists but has no password (e.g., signed up with Google)
		  return done(null, false, { message: "Please log in with Google." })
		}

		return done(null, user)
	  } catch (err) {
		return done(err)
	  }
	},
  ),
)

// Passport Google Strategy
passport.use(
  new GoogleStrategy(
	{
	  clientID: process.env.GOOGLE_CLIENT_ID,
	  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	  callbackURL: process.env.GOOGLE_CALLBACK_URL,
	  passReqToCallback: true, // Allows access to req in callback
	},
	async (request, accessToken, refreshToken, profile, done) => {
	  try {
		const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null
		const googleId = profile.id
		const fullName = profile.displayName

		if (!email) {
		  return done(new Error("No email found in Google profile."), null)
		}

		// Check if user exists by Google ID
		let userResult = await db.query("SELECT * FROM users WHERE google_id = $1", [googleId])
		let user = userResult.rows[0]

		if (user) {
		  // User exists, update their info if necessary
		  return done(null, user)
		} else {
		  // Check if user exists by email (might have signed up with email/password first)
		  userResult = await db.query("SELECT * FROM users WHERE email = $1", [email])
		  user = userResult.rows[0]

		  if (user) {
			// User exists with this email, link Google ID
			const updatedUser = await db.query("UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *", [
			  googleId,
			  user.id,
			])
			return done(null, updatedUser.rows[0])
		  } else {
			// New user, create an entry
			const newUser = await db.query(
			  "INSERT INTO users (full_name, email, google_id) VALUES ($1, $2, $3) RETURNING *",
			  [fullName, email, googleId],
			)
			return done(null, newUser.rows[0])
		  }
		}
	  } catch (err) {
		return done(err, null)
	  }
	},
  ),
)

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id)
})

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
	const userResult = await db.query("SELECT id, full_name, email, google_id FROM users WHERE id = $1", [id])
	const user = userResult.rows[0]
	done(null, user)
  } catch (err) {
	done(err, null)
  }
})

// API Routes
app.use("/api/auth", authRoutes)

// Basic protected route example
app.get("/api/protected", (req, res) => {
  if (req.isAuthenticated()) {
	res.json({ message: "You have access to protected data!", user: req.user })
  } else {
	res.status(401).json({ message: "Unauthorized. Please log in." })
  }
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
