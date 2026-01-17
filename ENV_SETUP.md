# Environment Variables Setup

## Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/splitmint
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### For Production (Render):
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=generate_a_secure_random_string_here
FRONTEND_URL=https://your-app-name.onrender.com
```

## Frontend Environment Variables (Optional)

Create a `.env` file in the `frontend` directory if you need to override the API URL:

```env
VITE_API_URL=/api
```

For development with separate backend:
```env
VITE_API_URL=http://localhost:5000/api
```

**Note:** In production, the frontend uses `/api` by default, which works when served from the same domain as the backend.
