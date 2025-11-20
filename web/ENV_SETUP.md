# Web App Environment Variables Setup (Firebase)

## Required Steps

1. **Create a `.env` file** in the `web` directory (same folder as `package.json`)

2. **Add your Firebase configuration** to the `.env` file:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Important Notes**:
   - All variables MUST be prefixed with `VITE_` for Vite to expose them
   - Do NOT add quotes around the values
   - Do NOT add spaces around the `=` sign
   - Get these values from your Firebase Console → Project Settings → General → Your apps

4. **Restart the dev server** after creating/editing the `.env` file:
   ```bash
   npm run dev
   ```

## Troubleshooting Authentication Errors

- If sign up/login fails:
  1. Make sure the `.env` file is in `roadmap-mvp/web/` directory
  2. Check the file name is exactly `.env` (not `.env.txt` or `.env.local`)
  3. Verify all 6 Firebase variables are set (not just some)
  4. Make sure all variables start with `VITE_`
  5. Restart the dev server after creating/editing `.env`
  6. Check the browser console for detailed error messages

## Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → Project Settings
4. Scroll down to "Your apps" section
5. If you haven't created a web app, click "Add app" → Web (</> icon)
6. Copy the config values from the Firebase SDK snippet

