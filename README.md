# Split Smart 💸

Split trips, rent, and dinners without the group-chat math.

Split Smart is a full-stack expense-splitting app that helps groups track shared expenses and settle up with the minimum number of transactions (debt simplification), instead of everyone paying everyone back separately.

## 🔗 Live Demo

- **App:** [https://splitsmart-p656.vercel.app](https://splitsmart-p656.vercel.app)
- **Backend API:** [https://splitsmart-backend-g6rr.onrender.com](https://splitsmart-backend-g6rr.onrender.com)

> Note: the backend runs on Render's free tier, so if it's been inactive for a while, the first request may take up to ~50 seconds while the server spins back up.

## ✨ Features

- User registration and login with JWT-based authentication
- Create groups and add members
- Log shared expenses within a group
- Automatic debt simplification — settle up with fewer transactions
- Persistent data storage with MongoDB

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- Axios for API calls
- Deployed on [Vercel](https://vercel.com)

**Backend**
- Node.js + Express
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- Deployed on [Render](https://render.com)

**Database**
- [MongoDB Atlas](https://www.mongodb.com/atlas) (cloud-hosted)

## 📁 Project Structure

```
expense-splitter/
├── backend/
│   ├── middleware/       # Auth middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes (auth, groups, expenses)
│   ├── utils/            # Helper functions (e.g. debt simplification logic)
│   ├── server.js         # App entry point
│   └── .env.example      # Environment variable template
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── api.js         # Axios instance + API base URL config
    │   ├── AuthContext.jsx
    │   └── App.jsx
    └── vite.config.js
```

## 🚀 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [MongoDB](https://www.mongodb.com/) running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone the repo

```bash
git clone https://github.com/omgadilkar/splitsmart.git
cd splitsmart
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (copy from `.env.example`) and fill in your own values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/splitsmart
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_own_secret_key
```

Start the backend:

```bash
node server.js
```

You should see:

```
✅ MongoDB Connected
🚀 Server running on port 5000
```

### 3. Set up the frontend

In a separate terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` with:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## ☁️ Deployment

This project is deployed using three separate services:

| Piece | Service |
|---|---|
| Database | MongoDB Atlas |
| Backend (Express API) | Render |
| Frontend (Vite/React) | Vercel |

Environment variables needed for deployment:

**Render (backend)**
```
MONGO_URI=<your Atlas connection string>
JWT_SECRET=<a secret string>
PORT=5000
CLIENT_URL=<your deployed frontend URL>
```

**Vercel (frontend)**
```
VITE_API_URL=<your deployed backend URL>/api
```

## 📄 License

This project is open source and available for personal and educational use.
