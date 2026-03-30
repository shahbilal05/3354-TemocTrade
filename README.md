# TemocTrade ☄️

TemocTrade is a centralized marketplace built specifically for UT Dallas students. It ensures a safe, verified environment where students can buy, sell, and bid on items using their `@utdallas.edu` email addresses.

## 🏗️ Architecture & Technologies

The project is split into two halves: a **Python Backend** and a **React Frontend**.

### 1. Backend (`/backend`)
- **FastAPI**: The core Python framework. It handles all the API routes quickly and provides automatic API documentation.
- **MongoDB (Motor)**: The NoSQL database where all users, listings, messages, orders, and bids are stored. We use `motor` to interact with it asynchronously.
- **JWT & bcrypt**: Used for user authentication. Passwords are mathematically hashed with bcrypt before touching the database, and users are issued JSON Web Tokens (JWT) to stay logged in securely.
- **Key File**: `main.py` – This file contains the entire API logic. It defines the database schemas (using Pydantic), connects to the database, and handles every request (e.g. `POST /auth/register`, `GET /listings`).

### 2. Frontend (`/frontend`)
- **React 18 & Vite**: The UI framework and build tool. Vite makes the development server start up instantly.
- **React Router**: Handles letting users navigate between different pages without reloading the browser (e.g. moving from `/` to `/profile`).
- **Axios**: Used to make HTTP requests (like fetching listings or logging in) to our FastAPI backend.
- **Design System**: A responsive, dark-mode focused UI using UTD brand colors (Green and Orange), styled in plain CSS (`index.css`).

---

##  How to Run the Project Locally

You will need **two terminal windows** open—one for the backend and one for the frontend.

### Terminal 1: Start the Backend (API)
Open a terminal and run:
```bash
cd backend

# (First time only) Install the Python dependencies:
pip install -r requirements.txt

# Start the server:
uvicorn main:app --reload
```
*Note: The backend will be running on `http://127.0.0.1:8000`. You can visit `http://127.0.0.1:8000/docs` to see the automated interactive API documentation.*

### Terminal 2: Start the Frontend (Website)
Open a second terminal and run:
```bash
cd frontend

# (First time only) Install the Node dependencies:
npm install

# Start the dev server:
npm run dev
```
*Note: The frontend will be running on `http://localhost:5173`. Open this URL in your browser to view the app.*

---

## Project Structure Overview

```text
3354-TemocTrade/
├── backend/
│   ├── main.py            # API endpoints & data models (auth, listings, etc)
│   ├── database.py        # MongoDB connection setup
│   ├── auth.py            # Security (password hashing, JWT token validation)
│   ├── requirements.txt   # Python packages needed
│   └── .env               # Secrets (MongoDB URI, JWT secret)
│
└── frontend/
    ├── src/
    │   ├── api.js         # API helpers (connects frontend to backend)
    │   ├── App.jsx        # Routing definitions for all pages
    │   ├── index.css      # The master design system (colors, buttons, cards)
    │   ├── main.jsx       # React entry point
    │   ├── pages/         # High-level screens (Home, Profile, Auth, etc)
    │   ├── components/    # Reusable UI parts (Navbar, ListingCard)
    │   └── context/       # AuthContext (remembers if you are logged in)
    ├── index.html         # Base HTML file
    ├── vite.config.js     # Dev server configuration
    └── package.json       # Node.js dependencies
```

## A Note on Environment Variables
The `backend/.env` file holds sensitive keys. **Don't commit the `.env` file to Github or share it.** 
It contains the `MONGODB_URI` (how your code connects to the Atlas Database cluster) and the `SECRET_KEY` (used for signing login tokens). If you pull the code to a new machine, you will need to manually re-create the `.env` file there.
