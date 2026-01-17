# Deployment Setup

## Backend Deployment (https://splitapp-e25v.onrender.com)

### Environment Variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=https://splitapp-frontend.onrender.com
```

### Build Command:
```
yarn install
```

### Start Command:
```
yarn start
```

### Root Directory:
```
backend
```

---

## Frontend Deployment (https://splitapp-frontend.onrender.com)

### Environment Variables:
```
VITE_BACKPATH=https://splitapp-e25v.onrender.com/api
```

### Build Command:
```
npm install && npm run build
```

### Start Command:
```
npm run preview
```

### Root Directory:
```
frontend
```

### Publish Directory:
```
dist
```
