# Setup & Run Guide

This guide explains how to install, configure, and run the **Personalized Learning Platform using AI** project locally.

---

## 1. Project Structure

The repository is organized as follows:

```
root/
├── server/      # Node.js + Express backend API
├── web/         # React + Vite frontend (SPA)
└── README.md
```

You will run `server` and `web` in two separate terminals.

---

## 2. Prerequisites

Before you start, make sure you have:

- **Node.js 18 or higher**
- **npm** (comes with Node)
- **A Firebase project** with:
  - Firestore (Native mode)
  - Firebase Authentication enabled (Email/Password or Google Sign-In)
- **API keys:**
  - Gemini API key (Google AI Studio)
  - Judge0 CE RapidAPI key (In Rapid API you have to subscribe to Judge0)
  - YouTube Data API v3 key (Google Cloud console)

> **Note:** This project includes `.env.example` files that list required variables without any real values.

---

## 3. Clone the Repository

```bash
git clone https://github.com/ayushcody/Learning.git
cd Learning
```

---

## 4. Backend Setup (`server/`)

### 4.1 Install Dependencies

```bash
cd server
npm install
```

### 4.2 Environment Variables

An example file is provided. Copy it to create your own:

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=4000
GEMINI_API_KEY=your_gemini_api_key
RAPIDAPI_KEY=your_judge0_rapidapi_key
YOUTUBE_API_KEY=your_youtube_data_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=service_account_email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> **Important:** Make sure the private key is properly escaped if you keep it on a single line (e.g., `\n` for newlines).

### 4.3 Start the Backend

```bash
npm run dev
# or
npm start
```

By default, the backend will run at:

```
http://localhost:4000
```

---

## 5. Frontend Setup (`web/`)

Open a **new terminal window or tab**.

### 5.1 Install Dependencies

```bash
cd web
npm install
```

### 5.2 Environment Variables

Create your `.env` file:

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
VITE_API_BASE=http://localhost:4000
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
# Add other Firebase web config keys if required (VITE_FIREBASE_MESSAGING_SENDER_ID, etc.)
```

### 5.3 Start the Frontend

```bash
npm run dev
```

The frontend will run at:

```
http://localhost:5173
```

Open this URL in your browser.

---

## 6. Firestore & Database Setup

**No manual schema creation is required**; Firestore collections are created on demand.

When you:

- **Sign up / sign in** → creates a document in `users/{uid}`
- **Generate roadmaps** → creates documents in `userRoadmaps/{uid}/entries` and/or `roadmaps`
- **Generate topic content** → creates documents in `topicContent/{slug}`
- **Run coding challenges** → creates documents in `submissions/{submissionId}`

### Optional: Seed Initial Data

If the backend exposes a seed endpoint, you can pre-populate some data:

```bash
curl -X POST http://localhost:8000/api/seed
```

This can add default tracks/topics so the dashboard isn't empty on first run.

---

## 7. Running the App (End-to-End)

1. **Start backend:**

   ```bash
   cd server
   npm run dev
   ```

2. **Start frontend** (in a second terminal):

   ```bash
   cd web
   npm run dev
   ```

3. **Open the app in your browser:**

   ```
   http://localhost:5173
   ```

4. **Sign up / Sign in** with Firebase Auth.

5. **Complete an AI assessment**, view your personalized roadmap, open topic content, and try a coding challenge in the embedded IDE.

---

## 8. Platform Notes

The commands above work on:

- **Windows** (PowerShell / CMD)
- **macOS** (Terminal)
- **Linux** (bash/zsh)

> **Windows Note:** If `cp` is not available on Windows CMD, you can manually duplicate `.env.example` and rename it to `.env` using File Explorer.

---

## 9. Common Issues

### CORS / API URL Issues

**Check** that `VITE_API_BASE` in `web/.env` exactly matches your backend URL (e.g., `http://localhost:4000`).

### Firebase Auth Errors

**Ensure** the Firebase web config matches the same project as your service account in the backend.

### Gemini / Judge0 / YouTube Errors

**Confirm** API keys are valid and present in `server/.env`. Check your console/logs for detailed error messages.

---

## 🚀 You're All Set!

The Personalized Learning Platform using AI should now be running locally. If you encounter any issues, refer to the troubleshooting section above or check the project's issue tracker on GitHub.
