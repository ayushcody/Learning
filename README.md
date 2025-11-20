# Roadmap MVP - Full Stack Developer Learning Platform

A production-ready learning platform MVP focused on Full Stack Developer career path. Users can sign up, complete onboarding, view interactive roadmaps, solve coding challenges in an embedded IDE, request AI hints, and track their progress with gamification elements.

## Project Overview

This is a full-stack application featuring:
- **Frontend**: React 18 + Vite, Tailwind CSS, React Router v6, Monaco Editor
- **Backend**: Node.js + Express, Firebase Admin SDK, Judge0 code execution, Google Gemini AI hints
- **Authentication**: Firebase Auth (Email/Password)
- **Database**: Firestore for user profiles, submissions, and roadmap data

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Firebase project with Firestore enabled
- Firebase service account key (JSON)
- (Optional) Judge0 RapidAPI account for code execution
- (Optional) Google Gemini API key for AI hints

## Local Setup (Windows PowerShell)

### 1. Install Dependencies

```powershell
# Server dependencies
cd .\roadmap-mvp\server
npm install

# Frontend dependencies
cd ..\web
npm install
```

### 2. Configure Environment Variables

#### Server Configuration

1. Copy `server/.env.example` to `server/.env`
2. Fill in your Firebase service account JSON:
   ```powershell
   cd .\server
   $env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content -Raw .\serviceAccountKey.json
   ```
3. Add other optional variables:
   - `GEMINI_API_KEY` (optional, for AI hints)
   - `RAPIDAPI_KEY` and `RAPIDAPI_HOST` (for Judge0)
   - `JUDGE0_URL`

#### Frontend Configuration

1. Copy `web/.env.example` to `web/.env`
2. Add your Firebase config values from Firebase Console:
   - Project Settings → General → Your apps → Web app config

### 3. Start the Development Server

```powershell
# Terminal 1: Start backend server
cd .\roadmap-mvp\server
$env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content -Raw .\serviceAccountKey.json
npm run dev

# Server runs on http://localhost:4000
```

```powershell
# Terminal 2: Start frontend dev server
cd .\roadmap-mvp\web
npm run dev

# Frontend runs on http://localhost:5173 (or printed port)
```

### 4. Seed the Roadmap Data

After the server is running, seed the Full Stack Developer roadmap:

```powershell
Invoke-RestMethod -Uri http://localhost:4000/api/seed -Method Post
```

### 5. Verify Setup

Health check:
```powershell
Invoke-RestMethod -Uri http://localhost:4000/api/health
```

Expected response: `{ "ok": true }`

## Local Verification Checklist

1. ✅ **Health Check**: `Invoke-RestMethod -Uri http://localhost:4000/api/health`
2. ✅ **Seed Roadmap**: `Invoke-RestMethod -Uri http://localhost:4000/api/seed -Method Post`
3. ✅ **Sign Up**: Open web app → Click "Sign Up" → Create account
4. ✅ **Open Roadmap**: Navigate to roadmap page → See Full Stack Developer roadmap
5. ✅ **Run Code**: Open a project step → Open IDE → Write code → Click "Run"
6. ✅ **Get Hint**: Click "Hint" button → Should return AI hint or fallback
7. ✅ **Submit**: Click "Submit" → Code is tested → Progress saved

## Deployment to Vercel

### Server Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Set root directory to `server`
4. Configure environment variables in Vercel dashboard:

```
PORT=4000
GEMINI_API_KEY=your_gemini_key (optional)
GEMINI_MODEL=gemini-2.5-flash
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
FIREBASE_SERVICE_ACCOUNT_JSON=<paste full JSON content>
```

### Frontend Deployment

1. Create a separate Vercel project for frontend
2. Set root directory to `web`
3. Configure environment variables:

```
VITE_API_BASE=https://your-server-url.vercel.app
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Troubleshooting

### Invalid PEM/Private Key Error

**Issue**: Firebase Admin SDK fails with "Invalid PEM" or "private_key" error.

**Solution**:
1. Re-download your Firebase service account key from Firebase Console
2. Use PowerShell to export it properly:
   ```powershell
   $env:FIREBASE_SERVICE_ACCOUNT_JSON = Get-Content -Raw .\serviceAccountKey.json
   ```
3. Ensure the JSON is properly formatted (no extra line breaks)

### Judge0 429 or Network Errors

**Issue**: Code execution fails with rate limit or network errors.

**Solution**:
- Verify `RAPIDAPI_KEY` and `RAPIDAPI_HOST` are set correctly
- Check `JUDGE0_URL` matches your Judge0 endpoint
- Slow down API calls (add delay between requests)
- Consider upgrading RapidAPI plan if hitting rate limits

### Gemini Not Working / Server Crash

**Issue**: `/api/hint` endpoint crashes or returns errors.

**Solution**:
- The server should gracefully fallback to deterministic hints if Gemini is not configured
- If server crashes, check that `@google/genai` package is installed: `npm install @google/genai`
- Verify `GEMINI_API_KEY` is valid (if using Gemini)
- Check server logs for specific error messages

### CORS Issues

**Issue**: Frontend can't connect to backend API.

**Solution**:
- Ensure `VITE_API_BASE` in frontend `.env` matches your server URL
- Server uses `cors()` middleware - verify it's enabled
- Check browser console for specific CORS error messages
- For local dev: `VITE_API_BASE=http://localhost:4000`

### Frontend Build Errors

**Issue**: Vite build fails or dependencies missing.

**Solution**:
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (requires 18+)
- Verify all environment variables are set

## Project Structure

```
roadmap-mvp/
├── README.md                 # This file
├── .gitignore                # Git ignore rules
├── server/                   # Express backend
│   ├── index.js              # Main server file with all endpoints
│   ├── package.json          # Backend dependencies
│   ├── .env.example          # Backend env template
│   └── serviceAccountKey.json # Placeholder (add your own)
└── web/                      # React frontend
    ├── package.json          # Frontend dependencies
    ├── vite.config.js        # Vite configuration
    ├── tailwind.config.cjs   # Tailwind CSS config
    ├── postcss.config.cjs    # PostCSS config
    ├── index.html            # HTML entry point
    ├── .env.example          # Frontend env template
    └── src/
        ├── main.jsx          # React entry point
        ├── App.jsx           # Main app component with routing
        ├── firebase.js       # Firebase initialization
        ├── index.css         # Global styles
        ├── pages/            # Page components
        ├── components/       # Reusable components
        ├── shared/           # Shared UI components
        └── data/             # Sample data files
```

## Features

- 🔐 Firebase Authentication (Email/Password)
- 📊 Interactive Roadmap with progress tracking
- 💻 Embedded Monaco Editor for coding challenges
- 🤖 AI-powered hints via Google Gemini (with fallback)
- ✅ Automated code testing via Judge0
- 🎮 Gamification: streaks, badges, progress bars
- 📱 Responsive design with Tailwind CSS
- ✨ Smooth animations with Framer Motion

## License

MIT


# PBL-SEM-5-Project-1