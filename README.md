# SplitMint - Your Gateway to Karbon

A full-stack MERN application for managing group expenses and splitting bills efficiently.

Deployed Link - https://splitapp-frontend.onrender.com/
## Features

-  **Authentication** - JWT-based user authentication
-  **Groups Management** - Create and manage expense groups (max 4 members)
-  **Participants Management** - Add/remove participants with validation
-  **Expense Tracking** - Add, edit, and delete expenses with multiple split modes
-  **Balance Engine** - Automatic balance calculations and settlement suggestions
-  **Dashboard Visualizations** - Summary cards showing total spent, owed, and owed to you
-  **Search & Filters** - Search expenses by text, filter by participant, date range, and amount
-  **UI Polish** - Loading states, empty states, error handling, and smooth animations

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Express Validator

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Axios
- Vite

## Project Structure

```
SplitMint/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Auth middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── ...
│   └── ...
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or connection string)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/splitmint
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open browser to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `GET /api/groups/:id/balances` - Get balance summary

### Expenses
- `GET /api/expenses/groups/:groupId/expenses` - Get expenses (with filters)
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary

### Users
- `GET /api/users` - Search users

## Split Modes

1. **Equal Split** - Divide expense equally among selected participants
2. **Custom Amount** - Specify exact amount per participant
3. **Percentage** - Split by percentage (must sum to 100%)

## License

MIT
