# Troubleshooting Guide - PDF Upload Not Working

## Issue Identified

**Problem**: PDF upload is not generating quizzes  
**Root Cause**: Gemini API connection error (`geminiApi: "error"`)

## Diagnosis Steps Completed

✅ Frontend UI working correctly  
✅ Backend server running on port 3001  
✅ API endpoints responding  
✅ CORS configured properly  
✅ File upload UI functional  
❌ Gemini API connection failing  

## Possible Causes

### 1. API Key Issues
- **Check**: API key in `server/.env` is correct
- **Verify**: Key has proper permissions in Google Cloud Console
- **Confirm**: Billing is enabled for the Google Cloud project

### 2. Network/Firewall
- **Check**: Internet connection is working
- **Verify**: No firewall blocking Google API requests
- **Test**: Try accessing https://generativelanguage.googleapis.com from browser

### 3. API Quota/Limits
- **Check**: API quota hasn't been exceeded
- **Verify**: No rate limiting in effect
- **Review**: Google Cloud Console for any alerts

## Quick Fixes to Try

### Fix 1: Verify API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Check if the API key `AIzaSyDvyYvR7qT1ZJFtlp2sCfRudyLEeHn32VU` is valid
3. If not, generate a new key
4. Update `server/.env` with new key
5. Restart server: `npm start`

### Fix 2: Test API Key Manually
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDvyYvR7qT1ZJFtlp2sCfRudyLEeHn32VU" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

If this returns an error, the API key is invalid or has issues.

### Fix 3: Enable Gemini API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Library"
4. Search for "Generative Language API"
5. Click "Enable"

### Fix 4: Check Billing
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to "Billing"
3. Ensure billing is enabled
4. Check for any payment issues

## Testing After Fixes

1. **Restart Backend**:
   ```bash
   cd server
   npm start
   ```

2. **Test Health Endpoint**:
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok","geminiApi":"connected",...}`

3. **Test PDF Upload**:
   - Go to http://localhost:5173
   - Select "AI Upload" mode
   - Upload a PDF
   - Should see "Generating Quiz with AI" loading screen
   - Quiz should start after 10-15 seconds

## Alternative: Use Mock Mode Temporarily

If you want to test the app while fixing the API:

1. The "Text Input" mode still works with mock data
2. Select a topic and difficulty
3. Click "Start Quiz"
4. This uses the existing mock questions

## Need More Help?

Check the backend server logs for detailed error messages:
- Look at the terminal where `npm start` is running
- Errors will show when you try to upload a PDF
- Share the error message for more specific help

## Server Status Check

Run this to verify everything:
```bash
# Check if server is running
curl http://localhost:3001/api/health

# Should return JSON with status
```

Expected response when working:
```json
{
  "status": "ok",
  "geminiApi": "connected",
  "timestamp": "2025-12-06T..."
}
```

Current response (with issue):
```json
{
  "status": "ok",
  "geminiApi": "error",
  "timestamp": "2025-12-06T..."
}
```
