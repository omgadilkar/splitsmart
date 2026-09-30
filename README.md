# Split Smart 💸

Split trips, rent, and dinners without the group-chat math.

Split Smart is a modern, premium full-stack expense-splitting application that helps groups track shared expenses and settle up with the minimum number of transactions (debt simplification), instead of everyone paying everyone back separately. 

## ✨ Key Features

- **Smart Settlement Engine**: Turn a tangled web of group IOUs into a simple, mathematically optimized payment plan to minimize total transactions.
- **Financial Command Center**: A sleek, fintech-style dashboard answering "What do I owe?" and "What am I owed?" instantly.
- **Spending Insights**: Visual analytics (Pie charts and Bar charts) breaking down group spending by category and monthly trends.
- **Custom Splits**: Split bills equally or exactly by custom percentages and amounts.
- **Modern UX/UI**: Premium aesthetics, skeleton loading states, global toast notifications, and responsive mobile-first design.
- **Secure Authentication**: Complete user registration and login flows protected by JSON Web Tokens (JWT).

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- Recharts (for analytics visualizations)
- Vanilla CSS (Custom Design System)
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
│   ├── models/           # Mongoose schemas (User, Group, Expense)
│   ├── routes/           # API routes
│   ├── utils/            # Smart debt simplification algorithm
│   ├── server.js         # App entry point
│   └── .env.example      # Environment variable template
└── frontend/
    ├── src/
    │   ├── components/   # Reusable UI (Modals, TopBar)
    │   ├── pages/        # Dashboard, GroupWorkspaces, Auth
    │   ├── api.js        # Axios instance + API base URL config
    │   ├── ToastContext.jsx # Global notification state
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

Create a `.env` file in `backend/` and fill in your own values:

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

This project is built to be deployed using three separate services:

| Piece | Service |
|---|---|
| Database | MongoDB Atlas |
| Backend (Express API) | Render, Railway, or Heroku |
| Frontend (Vite/React) | Vercel or Netlify |

Environment variables needed for deployment:

**Backend Environment**
```
MONGO_URI=<your Atlas connection string>
JWT_SECRET=<a secure random string>
PORT=5000
CLIENT_URL=<your deployed frontend URL>
```

**Frontend Environment (Vercel)**
```
VITE_API_URL=<your deployed backend URL>/api
```

## 📄 License

This project is open source and available for personal and educational use.
