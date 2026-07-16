# SplitSmart — Smart Group Expense Splitter

A full-stack expense-sharing app (like Splitwise) that tracks group expenses
and — the core feature — computes the **minimum number of transactions**
needed to settle all debts in a group, instead of everyone paying everyone
back individually.

## Why this project is a strong interview piece

Most student "expense tracker" projects are simple CRUD apps. This one has a
genuine algorithmic core (`backend/utils/simplifyDebts.js`) that you can
explain in depth: given N people's net balances, it greedily matches the
biggest creditor with the biggest debtor until everyone is settled, cutting a
group of 6 people's tangled IOUs down to as few as 3–5 payments instead of
15+. That's a concrete "tell me about a technical challenge" answer.

## Features

- JWT-based authentication (register/login)
- Create groups, add members by email
- Log expenses with **equal or custom (unequal) splits**
- Real-time balance calculation per member
- **Debt simplification algorithm** — minimum settle-up transactions
- Spending insights: category breakdown (pie chart) and monthly trend (bar chart)
- Clean, distinctive UI (not a generic Bootstrap template)

## Tech stack

| Layer     | Tech                                                    |
|-----------|----------------------------------------------------------|
| Frontend  | React 18, Vite, React Router, Recharts, Axios            |
| Backend   | Node.js, Express, JWT, bcrypt                            |
| Database  | MongoDB with Mongoose                                    |
| Auth      | JSON Web Tokens (stateless auth)                          |

## Architecture

```
expense-splitter/
├── backend/
│   ├── models/          # User, Group, Expense (Mongoose schemas)
│   ├── routes/          # auth, groups, expenses (REST endpoints)
│   ├── middleware/      # JWT auth guard
│   ├── utils/
│   │   └── simplifyDebts.js   # <-- the core algorithm
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/       # Login, Register, Dashboard, GroupDetail
│       ├── components/  # AddExpenseModal, TopBar, ProtectedRoute
│       ├── AuthContext.jsx
│       └── api.js       # Axios instance with JWT interceptor
└── README.md
```

## How the debt simplification algorithm works

1. For every expense, the payer's balance goes **up** by the full amount,
   and each participant's balance goes **down** by their share.
2. This gives every group member a single **net balance**: positive means
   "the group owes them," negative means "they owe the group."
3. Split members into creditors (net > 0) and debtors (net < 0), sort each
   list descending by amount.
4. Repeatedly match the largest debtor with the largest creditor, settle
   the smaller of the two amounts between them, and remove whoever hits
   zero. Repeat until both lists are empty.

This greedy approach runs in **O(n log n)** and produces a near-minimal
(in practice, often exactly minimal) transaction count — a big improvement
over the naive O(n²) "everyone pays everyone" approach.

## Local setup

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a free MongoDB Atlas cluster

### Backend
```bash
cd backend
npm install
cp .env.example .env     # fill in MONGO_URI and a JWT_SECRET
npm run dev              # starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env     # set VITE_API_URL if backend isn't on localhost:5000
npm run dev              # starts on http://localhost:5173
```

Open http://localhost:5173, register two or three accounts (use different
browsers/incognito windows to simulate different users), create a group,
add each other as members, and start logging expenses.

## Deployment suggestion

- Backend → Render / Railway (free tier works fine)
- Frontend → Vercel / Netlify
- Database → MongoDB Atlas free tier

Once deployed, put the **live link** on your resume, not just the GitHub
repo — a working demo is worth far more in an interview.

## Possible extensions (mention these if asked "what would you add next?")

- Email/SMS reminders for pending settlements
- Multi-currency support
- Receipt image upload (OCR to auto-extract amount)
- "Optimal" debt simplification via min-cost-flow (true mathematical minimum,
  vs. this project's greedy near-optimal approach) — a great way to show you
  know the greedy solution's limitation and the more advanced alternative

## License

MIT — free to use for learning, portfolio, or interview purposes.
