const bcrypt = require("bcrypt");
const db = require("../db");
const passport = require("passport");

const SALT_ROUNDS = 10;

const signup = async (req, res) => {
	const { fullName, email, password } = req.body;

	try {
		// Check if user already exists
		const existingUser = await db.query(
			"SELECT id FROM users WHERE email = $1",
			[email]
		);
		if (existingUser.rows.length > 0) {
			return res
				.status(409)
				.json({ message: "User with this email already exists." });
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

		// Store user in database
		const result = await db.query(
			"INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING id, full_name, email",
			[fullName, email, hashedPassword]
		);

		res.status(201).json({
			message: "User registered successfully. Please log in.",
			user: {
				id: result.rows[0].id,
				fullName: result.rows[0].full_name,
				email: result.rows[0].email,
			},
		});
	} catch (error) {
		console.error("Signup error:", error);
		res.status(500).json({ message: "Server error during signup." });
	}
};

const login = async (req, res, next) => {
	passport.authenticate("local", (err, user, info) => {
		if (err) {
			console.error("Passport authentication error:", err);
			return res
				.status(500)
				.json({ message: "Server error during login." });
		}
		if (!user) {
			return res.status(401).json({ message: info.message });
		}
		req.logIn(user, (err) => {
			if (err) {
				console.error("Login error:", err);
				return res
					.status(500)
					.json({ message: "Server error during login." });
			}
			// Do not send password hash to frontend
			const { password, ...userData } = user;
			res.status(200).json({
				message: "Logged in successfully!",
				user: userData,
			});
		});
	})(req, res, next);
};

const googleAuthCallback = (req, res) => {
	// Successful authentication, redirect or respond with user data
	// For a React frontend, you might want to redirect to a specific URL
	// or send a success response with user info.
	// For simplicity, we'll redirect to a success page or send user data.
	if (req.user) {
		// Do not send password hash to frontend
		const { password, ...userData } = req.user;
		res.status(200).json({
			message: "Google login successful!",
			user: userData,
		});
		// Or redirect: res.redirect('/dashboard');
	} else {
		res.status(401).json({ message: "Google login failed." });
		// Or redirect: res.redirect('/login?error=google_failed');
	}
};

module.exports = {
	signup,
	login,
	googleAuthCallback,
};
