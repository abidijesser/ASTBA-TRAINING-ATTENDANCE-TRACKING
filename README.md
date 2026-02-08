# Maratech ASTBA - MERN Stack Application

A production-ready full-stack MERN (MongoDB, Express, React, Node.js) application with JWT authentication, Cloudinary file storage, and modern best practices.

## 🚀 Features

- **JWT Authentication**: Secure user registration and login with JSON Web Tokens
- **Protected Routes**: Client-side and server-side route protection
- **Cloud File Storage**: Upload and manage files using Cloudinary
- **MongoDB Atlas**: Cloud-based MongoDB database with Mongoose ODM
- **RESTful API**: Clean API architecture with proper separation of concerns
- **Input Validation**: Server-side validation using express-validator
- **Error Handling**: Centralized error handling middleware
- **Security**: Password hashing with bcrypt, CORS configuration, JWT verification
- **Modern Frontend**: React 18 with Vite for fast development
- **Context API**: Global authentication state management

## 📁 Project Structure

```
Maratech-ASTBA/
├── backend/                 # Backend Node.js/Express application
│   ├── src/
│   │   ├── config/         # Configuration files (database, cloudinary)
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware (auth, upload, error handling)
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (cloudinary service)
│   │   ├── utils/          # Utility functions (validators)
│   │   └── server.js       # Express server entry point
│   ├── .env.example        # Environment variables template
│   └── package.json
├── frontend/               # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React Context providers
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # React entry point
│   ├── .env.example       # Environment variables template
│   └── package.json
├── package.json           # Root package.json with scripts
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Cloud file storage
- **express-validator** - Input validation
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management

## ⚙️ Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB Atlas account** (free tier available at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
- **Cloudinary account** (free tier available at [cloudinary.com](https://cloudinary.com/))

## 📝 Environment Variables

### Backend (.env)

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - Get from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Cloudinary Configuration - Get from Cloudinary Dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional - Frontend URL for CORS
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Getting Started

### 1. Clone or navigate to the project

```bash
cd Maratech-ASTBA
```

### 2. Install dependencies for both frontend and backend

```bash
npm run install-all
```

Or install manually:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Set up environment variables

Create `.env` files in both `backend` and `frontend` directories using the `.env.example` templates.

**Important**: 
- Get your MongoDB connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your Cloudinary credentials from [Cloudinary Dashboard](https://cloudinary.com/console)

### 4. Run the application

From the root directory:

```bash
# Run both frontend and backend concurrently
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 5. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |

### File Upload

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/upload` | Upload file to Cloudinary | Private |
| DELETE | `/api/upload/:publicId` | Delete file from Cloudinary | Private |

### Example API Requests

**Register User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

## 🤖 ML (Flask) Certification Prediction

This repo also contains a small **Flask** API that loads the trained artifacts stored in `backend/certification_model.pkl` and `backend/scaler.pkl` and serves a prediction endpoint (no separate microservice for the model inside Flask).

### Install (Windows)

From `backend/`:

```powershell
py -3.11 -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Run

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python ml_server.py
```

Default URL: `http://localhost:8000`

### Endpoints

- `GET /api/health`
- `GET /api/ml/schema`
- `POST /api/ml/predict-certification`

Example request:

```bash
curl -X POST http://localhost:8000/api/ml/predict-certification \
  -H "Content-Type: application/json" \
  -d '{
    "attendance_rate": 0.92,
    "missed_sessions": 2,
    "levels_completed": 5,
    "avg_quiz_score": 78,
    "engagement_score": 0.81
  }'
```

### Optional environment variables

- `ML_MODEL_PATH` (default: `backend/certification_model.pkl`)
- `ML_SCALER_PATH` (default: `backend/scaler.pkl`)
- `ML_PORT` (default: `8000`)
- `ML_THRESHOLD` (default: `0.5`)
- `ML_ATTENDANCE_RATE_MODE` = `auto` | `fraction` | `percent` (default: `auto`)
- `ML_CORS_ORIGINS` (comma-separated origins; default: `CLIENT_URL` or `http://localhost:5173`)
```

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Current User**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔐 Authentication Flow

1. User registers or logs in
2. Backend validates credentials and generates JWT token
3. Token is sent to frontend and stored in localStorage
4. Frontend includes token in Authorization header for protected requests
5. Backend middleware verifies token on protected routes
6. User data is attached to request object for use in controllers

## 📤 File Upload Flow

1. User selects file in dashboard
2. Frontend sends file to backend via FormData
3. Multer middleware processes file upload
4. Backend uploads file buffer to Cloudinary
5. Cloudinary returns URL and public_id
6. Frontend displays uploaded image
7. User can delete file, which removes it from Cloudinary

## 🏗️ Architecture Decisions

### Backend Architecture

- **MVC Pattern**: Separation of routes, controllers, and models
- **Service Layer**: Business logic separated from controllers (Cloudinary service)
- **Middleware**: Reusable authentication, validation, and error handling
- **Environment Configuration**: Centralized config using dotenv
- **Error Handling**: Global error handler catches all errors consistently

### Frontend Architecture

- **Component-Based**: Reusable components for Layout, FileUpload, etc.
- **Context API**: Global authentication state without Redux overhead
- **Service Layer**: API calls abstracted into service modules
- **Protected Routes**: Higher-order component for route protection
- **Axios Interceptors**: Automatic token injection and error handling

## 🔒 Security Best Practices

- ✅ Passwords hashed with bcrypt (10 salt rounds)
- ✅ JWT tokens with expiration
- ✅ Protected routes on both frontend and backend
- ✅ Input validation and sanitization
- ✅ CORS configured to allow only specified origins
- ✅ Environment variables for sensitive data
- ✅ MongoDB injection protection via Mongoose
- ✅ File upload size limits (5MB)
- ✅ File type validation (images only)

## 📦 Building for Production

### Build Frontend

```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/`.

### Deployment Considerations

1. **Environment Variables**: Set production environment variables on your hosting platform
2. **MongoDB**: Use MongoDB Atlas production cluster
3. **Cloudinary**: Ensure Cloudinary credentials are for production
4. **CORS**: Update `CLIENT_URL` to your production frontend URL
5. **JWT Secret**: Use a strong, random JWT secret in production
6. **NODE_ENV**: Set to `production` for optimized error messages

## 🧪 Testing

### Test Backend API

```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### Manual Testing Checklist

- [ ] Register a new user
- [ ] Login with created credentials
- [ ] Verify JWT token in localStorage
- [ ] Access dashboard (protected route)
- [ ] Upload an image file
- [ ] Verify file appears in Cloudinary dashboard
- [ ] Delete uploaded file
- [ ] Logout and verify redirect
- [ ] Try accessing dashboard without login (should redirect)

## 🤝 Contributing

This is a starter template. Feel free to extend it with:

- User profile updates
- Password reset functionality
- Email verification
- Social authentication
- Admin panel
- Additional CRUD operations
- Real-time features with Socket.io
- More file types support

## 📄 License

MIT License - feel free to use this project for learning or as a starter template.

## 🆘 Troubleshooting

**MongoDB Connection Error**
- Verify your MongoDB URI is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure you replaced `username`, `password`, and `dbname` in the URI

**Cloudinary Upload Fails**
- Verify Cloudinary credentials are correct
- Check file size is under 5MB
- Ensure file is an image

**CORS Error**
- Check `CLIENT_URL` in backend `.env` matches frontend URL
- Verify CORS is configured correctly in `server.js`

**JWT Token Issues**
- Ensure `JWT_SECRET` is set in backend `.env`
- Check token is being sent in Authorization header
- Verify token hasn't expired

## 📧 Support

For questions or issues, please check the code comments or create an issue in the repository.

---

**Built with ❤️ using the MERN stack**
