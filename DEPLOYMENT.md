# Deployment Guide for Render

## Prerequisites
- MongoDB Atlas account (or MongoDB instance)
- Render account

## Step 1: Prepare MongoDB

1. Create a MongoDB Atlas cluster (free tier available)
2. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/splitmint`
3. Add your Render server IP to MongoDB Atlas Network Access whitelist (or use 0.0.0.0/0 for all IPs)

## Step 2: Deploy to Render

### Option A: Using Render Dashboard

1. **Create a new Web Service** on Render
2. **Connect your repository** (GitHub/GitLab)
3. **Configure the service:**
   - **Name:** splitmint
   - **Environment:** Node
   - **Root Directory:** Leave empty (or `backend` if deploying from root)
   - **Build Command:** `npm install && cd frontend && npm install && npm run build && cd ..`
   - **Start Command:** `cd backend && npm start`
   - **Environment Variables:**
     ```
     NODE_ENV=production
     PORT=10000
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_secure_random_string_here
     FRONTEND_URL=https://your-app-name.onrender.com
     ```

### Option B: Using render.yaml (Recommended)

1. The `render.yaml` file is already configured
2. Push your code to GitHub
3. In Render dashboard, select "New Blueprint" and connect your repository
4. Render will automatically detect `render.yaml` and configure the service

## Step 3: Environment Variables

Set these in Render Dashboard under your service → Environment:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Server port (Render auto-assigns, but this is a fallback) |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB connection string |
| `JWT_SECRET` | `random-secure-string` | Secret key for JWT tokens (use a strong random string) |
| `FRONTEND_URL` | `https://your-app.onrender.com` | Your Render app URL |

**Important:** Generate a secure JWT_SECRET:
```bash
# On Linux/Mac:
openssl rand -base64 32

# Or use any secure random string generator
```

## Step 4: Build Configuration

The backend will:
1. Build the frontend automatically during deployment
2. Serve the built frontend files from the `/frontend/dist` directory
3. Handle API routes through `/api/*`
4. Route all other requests to the React app

## Step 5: Verify Deployment

1. Visit your Render URL: `https://your-app-name.onrender.com`
2. Test the health endpoint: `https://your-app-name.onrender.com/api/health`
3. Try registering a new account
4. Test login functionality

## Troubleshooting

### Build Fails
- Check that all dependencies are listed in `package.json`
- Verify Node.js version (Render uses Node 18+ by default)
- Check build logs for specific errors

### MongoDB Connection Issues
- Verify MongoDB URI is correct
- Check MongoDB Atlas Network Access settings
- Ensure IP whitelist includes Render servers (or use 0.0.0.0/0)

### API Requests Fail
- Verify `FRONTEND_URL` matches your Render URL
- Check CORS configuration in `backend/server.js`
- Verify environment variables are set correctly

### Frontend Not Loading
- Check that `frontend/dist` folder exists after build
- Verify static file serving configuration
- Check browser console for errors

## Manual Deployment Steps

If you prefer to deploy backend and frontend separately:

1. **Backend Service:**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Frontend Service:**
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview` (or use nginx/similar)
   - Set `VITE_API_URL` to your backend URL

Then update `FRONTEND_URL` in backend to match your frontend service URL.

## Notes

- Render free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading for production use
- Database backups are recommended for production
