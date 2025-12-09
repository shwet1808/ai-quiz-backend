# AI Quiz Generator - Backend

The backend server for the AI Quiz Generator. It handles text processing and integrates with Google's Gemini API to generate high-quality quiz questions.

## API Overview
This server exposes endpoints to accept text content and return structured quiz JSON data.

- **POST /api/generate-quiz**: Accepts text/PDF content and returns quiz questions.
- **GET /api/health**: Check server status.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Integration**: Google Generative AI (Gemini)
- **File Handling**: Multer, PDF Parse

## Setup Instructions

1. **Prerequisites**: Ensure you have Node.js installed.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Create a `.env` file in the root directory with the following:
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=3001
   ```

## How to Run

Start the server:

```bash
npm run dev
```

The server will run on `http://localhost:3001`.
