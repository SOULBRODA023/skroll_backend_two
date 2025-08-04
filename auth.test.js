const request = require("supertest");
const app = require("./app"); // Import the app instance
const bcrypt = require("bcrypt");
const db = require("./db"); // Import the mocked db module
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Mock bcrypt
jest.mock("bcrypt");

// Mock db module
jest.mock("./db", () => ({
	query: jest.fn(),
}));

// Mock passport's initialize, session, serializeUser, deserializeUser, and authenticate
jest.mock("passport", () => {
	const mockPassport = {
		initialize: jest.fn(() => (req, res, next) => next()),
		session: jest.fn(() => (req, res, next) => next()),
		authenticate: jest.fn((strategy, callback) => (req, res, next) => {
			req.logIn = jest.fn((user, cb) => cb(null));
			callback(null, false, { message: "Authentication failed" });
		}),
		serializeUser: jest.fn(),
		deserializeUser: jest.fn(),
		use: jest.fn(),
	};

	return mockPassport;
});

jest.mock("passport-google-oauth20", () => ({
	Strategy: jest.fn().mockImplementation(() => {}),
}));

let server;

describe("Auth Routes", () => {
	beforeAll((done) => {
		server = app.listen(0, () => {
			done();
		});
	});

	afterAll((done) => {
		server.close(done);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		passport.authenticate.mockImplementation(
			(strategy, callback) => (req, res, next) => {
				req.logIn = jest.fn((user, cb) => cb(null));
				callback(null, false, { message: "Authentication failed" });
			}
		);
	});

	describe("POST /api/auth/signup", () => {
		it("should register a new user", async () => {
			bcrypt.hash.mockResolvedValue("hashedPassword");
			db.query.mockResolvedValueOnce({ rows: [] });
			db.query.mockResolvedValueOnce({
				rows: [
					{
						id: 1,
						full_name: "Test User",
						email: "test@example.com",
					},
				],
			});

			const res = await request(server).post("/api/auth/signup").send({
				fullName: "Test User",
				email: "test@example.com",
				password: "Password@123",
			});

			expect(res.statusCode).toEqual(201);
			expect(res.body.message).toContain("User registered successfully");
			expect(res.body.user).toHaveProperty("id", 1);
			expect(bcrypt.hash).toHaveBeenCalledWith("Password@123", 10);
			expect(db.query).toHaveBeenCalledTimes(2);
		});

		it("should return 409 if user already exists", async () => {
			db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

			const res = await request(server).post("/api/auth/signup").send({
				fullName: "Test User",
				email: "test@example.com",
				password: "Password@123",
			});

			expect(res.statusCode).toEqual(409);
			expect(res.body.message).toEqual(
				"User with this email already exists."
			);
			expect(db.query).toHaveBeenCalledTimes(1);
		});

		it("should return 400 for invalid input", async () => {
			const res = await request(server).post("/api/auth/signup").send({
				fullName: "Te",
				email: "notanemail",
				password: "123",
			});

			expect(res.statusCode).toEqual(400);
			expect(res.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						field: expect.any(String),
						message: expect.any(String),
					}),
				])
			);
		});
	});

	describe("POST /api/auth/login", () => {
		it("should return 401 if user not found", async () => {
			passport.authenticate.mockImplementation(
				(strategy, callback) => (req, res, next) => {
					req.logIn = jest.fn((user, cb) => cb(null));
					callback(null, false, {
						message: "Incorrect email or password.",
					});
				}
			);

			const res = await request(server).post("/api/auth/login").send({
				email: "notfound@example.com",
				password: "anyPassword1!",
			});

			expect(res.statusCode).toEqual(401);
			expect(res.body.message).toEqual("Incorrect email or password.");
		});

		it("should return 401 if password is incorrect", async () => {
			passport.authenticate.mockImplementation(
				(strategy, callback) => (req, res, next) => {
					req.logIn = jest.fn((user, cb) => cb(null));
					callback(null, false, {
						message: "Incorrect email or password.",
					});
				}
			);

			const res = await request(server).post("/api/auth/login").send({
				email: "test@example.com",
				password: "WrongPass1!",
			});

			expect(res.statusCode).toEqual(401);
			expect(res.body.message).toEqual("Incorrect email or password.");
		});

		it("should login successfully and return user object", async () => {
			const mockUser = {
				id: 1,
				full_name: "Test User",
				email: "test@example.com",
			};

			passport.authenticate.mockImplementation(
				(strategy, callback) => (req, res, next) => {
					req.logIn = jest.fn((u, cb) => cb(null));
					callback(null, mockUser, {
						message: "Logged in successfully",
					});
				}
			);

			const res = await request(server).post("/api/auth/login").send({
				email: "test@example.com",
				password: "CorrectPassword1!",
			});

			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Logged in successfully!");
			expect(res.body.user).toEqual({
				id: 1,
				full_name: "Test User",
				email: "test@example.com",
			});
			expect(passport.authenticate).toHaveBeenCalledTimes(1);
		});
	});
});
