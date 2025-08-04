# Express.js Authentication Boilerplate

A robust authentication system for Node.js applications using Express, Passport.js (Local and Google OAuth), bcrypt for password hashing, and PostgreSQL for data storage. Includes input validation and Jest for testing.

## ✨ Features

*   **Local Email/Password Authentication**: Secure signup and login with hashed passwords.
*   **Google OAuth 2.0 Integration**: Seamless login via Google accounts.
*   **Password Hashing**: Uses `bcrypt` to securely hash and verify user passwords.
*   **Session Management**: Utilizes `express-session` for managing user sessions.
*   **Input Validation**: Robust validation for signup and login inputs using `express-validator`.
*   **PostgreSQL Database**: Stores user data in a PostgreSQL database.
*   **Unit Testing**: Comprehensive tests for authentication routes using Jest and Supertest.

## 🚀 Technologies Used

*   [Node.js](https://nodejs.org/)
*   [Express.js](https://expressjs.com/)
*   [Passport.js](http://www.passportjs.org/) (Local Strategy, Google Strategy)
*   [bcrypt](https://www.npmjs.com/package/bcrypt)
*   [pg](https://node-postgres.com/) (PostgreSQL client)
*   [express-validator](https://express-validator.github.io/docs/)
*   [express-session](https://www.npmjs.com/package/express-session)
*   [dotenv](https://www.npmjs.com/package/dotenv)
*   [Jest](https://jestjs.io/) (for testing) [^1]
*   [Supertest](https://www.npmjs.com/package/supertest) (for HTTP assertions)

## 🛠️ Getting Started

Follow these steps to get the project up and running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
*   [npm](https://www.npmjs.com/get-npm) (comes with Node.js) or [Yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
*   [PostgreSQL](https://www.postgresql.org/download/)

### Installation

1.  **Clone the repository:**
    \`\`\`bash
    git clone https://github.com/SOULBRODA023/skroll_backend_two.git
    cd <project-folder>
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    \`\`\`

### Environment Variables

Create a `.env` file in the root of your project and add the following environment variables. You can use the provided `.env.example` as a template.

\`\`\`
PORT=3001
DATABASE_URL="postgresql://user:password@host:port/database"
SESSION_SECRET="your_super_secret_session_key_here"
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"
\`\`\`

*   \`PORT\`: The port your server will run on.
*   \`DATABASE_URL\`: Your PostgreSQL connection string.
*   \`SESSION_SECRET\`: A strong, random string used to sign the session ID cookie.
*   \`GOOGLE_CLIENT_ID\`: Your Google OAuth client ID. Obtain this from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
*   \`GOOGLE_CLIENT_SECRET\`: Your Google OAuth client secret.
*   \`GOOGLE_CALLBACK_URL\`: The redirect URI configured in your Google Cloud Console for OAuth.

### Database Setup

Connect to your PostgreSQL database and create the `users` table using the following SQL schema:

\`\`\`sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- Nullable for Google-only users
    google_id VARCHAR(255) UNIQUE, -- Nullable for email/password users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## 🏃 Running the Application

To start the development server:

\`\`\`bash
npm start
# or
node app.js
\`\`\`

The server will be running at \`http://localhost:3001\` (or the port you specified in your \`.env\` file).

## 🌐 API Endpoints

All authentication routes are prefixed with \`/api/auth\`.

### 1. Register a New User (Local)

*   **URL**: \`/api/auth/signup\`
*   **Method**: \`POST\`
*   **Request Body**:
    \`\`\`json
    {
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "password": "StrongPassword123!"
    }
    \`\`\`
*   **Success Response (201 Created)**:
    \`\`\`json
    {
        "message": "User registered successfully. Please log in.",
        "user": {
            "id": 1,
            "fullName": "John Doe",
            "email": "john.doe@example.com"
        }
    }
    \`\`\`
*   **Error Response (400 Bad Request - Validation Error)**:
    \`\`\`json
    {
        "errors": [
            {
                "field": "email",
                "message": "Invalid email format."
            }
        ]
    }
    \`\`\`
*   **Error Response (409 Conflict - User Exists)**:
    \`\`\`json
    {
        "message": "User with this email already exists."
    }
    \`\`\`

### 2. Login User (Local)

*   **URL**: \`/api/auth/login\`
*   **Method**: \`POST\`
*   **Request Body**:
    \`\`\`json
    {
        "email": "john.doe@example.com",
        "password": "StrongPassword123!"
    }
    \`\`\`
*   **Success Response (200 OK)**:
    \`\`\`json
    {
        "message": "Logged in successfully!",
        "user": {
            "id": 1,
            "full_name": "John Doe",
            "email": "john.doe@example.com"
        }
    }
    \`\`\`
*   **Error Response (401 Unauthorized)**:
    \`\`\`json
    {
        "message": "Incorrect email or password."
    }
    \`\`\`

### 3. Initiate Google OAuth

*   **URL**: \`/api/auth/google\`
*   **Method**: \`GET\`
*   **Description**: Redirects to Google's authentication page.

### 4. Google OAuth Callback

*   **URL**: \`/api/auth/google/callback\`
*   **Method**: \`GET\`
*   **Description**: This is the redirect URI Google will send the user back to after authentication. Passport.js handles the user creation/login.
*   **Success Response (200 OK)**:
    \`\`\`json
    {
        "message": "Google login successful!",
        "user": {
            "id": 2,
            "full_name": "Google User",
            "email": "google.user@example.com",
            "google_id": "1234567890"
        }
    }
    \`\`\`
*   **Error Response (401 Unauthorized)**:
    \`\`\`json
    {
        "message": "Google login failed."
    }
    \`\`\`

### 5. Protected Route Example

*   **URL**: \`/api/protected\`
*   **Method**: \`GET\`
*   **Description**: An example route that requires the user to be authenticated.
*   **Success Response (200 OK)**:
    \`\`\`json
    {
        "message": "You have access to protected data!",
        "user": {
            "id": 1,
            "full_name": "John Doe",
            "email": "john.doe@example.com"
        }
    }
    \`\`\`
*   **Error Response (401 Unauthorized)**:
    \`\`\`json
    {
        "message": "Unauthorized. Please log in."
    }
    \`\`\`

## 🧪 Testing

This project uses Jest for unit and integration testing.

To run the tests:

\`\`\`bash
npm test
\`\`\`

The tests cover the signup and login functionalities, including validation and error handling.

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
