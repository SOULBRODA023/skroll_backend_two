const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

async function initializeDatabase() {
	try {
		const client = await pool.connect();
		const schemaSql = fs.readFileSync(
			path.resolve(__dirname, "../db/init.sql"),
			"utf8"
		);
		await client.query(schemaSql);
		console.log("Database schema initialized successfully!");
		client.release();
	} catch (err) {
		console.error("Error initializing database:", err);
	} finally {
		await pool.end();
	}
}

initializeDatabase();
