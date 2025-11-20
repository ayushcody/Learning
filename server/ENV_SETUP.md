# Server Environment Variables Setup

## Required Steps

1. **Create a `.env` file** in the `server` directory (same folder as `index.js`)

2. **Add your Gemini API Key** to the `.env` file:
   ```
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Important Notes**:
   - Do NOT add quotes around the value
   - Do NOT add spaces around the `=` sign
   - Make sure there are no extra spaces before or after the value
   - Example of CORRECT format: `GEMINI_API_KEY=AIzaSyABC123...`
   - Example of WRONG format: `GEMINI_API_KEY = "AIzaSyABC123..."` ❌

4. **Optional Variables** (add if needed):
   ```
   PORT=4000
   GEMINI_MODEL=gemini-2.5-flash
   ```

5. **Restart the server** after creating/editing the `.env` file:
   ```bash
   npm run dev
   ```

## Troubleshooting

- If you still see "Gemini API key not set":
  1. Make sure the `.env` file is in `roadmap-mvp/server/` directory
  2. Check the file name is exactly `.env` (not `.env.txt` or `.env.local`)
  3. Verify there are no typos in the variable name: `GEMINI_API_KEY`
  4. Make sure you saved the file before running the server

