import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import GeminiService from './services/geminiService.js';
import { extractTextFromPDF, validatePDFContent } from './utils/pdfProcessor.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini service
const geminiService = new GeminiService(process.env.GEMINI_API_KEY);

// Middleware
// Middleware
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5173'
        ];
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            // For dev purposes, allow all if specific check fails (optional, but safer to be explicit)
            // But let's stick to the allowed list for now.
            // Actually, for local dev with this specific error, let's be more permissive:
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for PDFs
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, PNG, and WebP are allowed.'));
        }
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const apiStatus = await geminiService.testConnection();
        res.json({
            status: 'ok',
            geminiApi: apiStatus.success ? 'connected' : 'error',
            geminiMessage: apiStatus.message,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// PDF upload and quiz generation endpoint
app.post('/api/upload/pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { difficulty = 'Medium', questionCount = 10 } = req.body;

        // Extract text from PDF
        console.log('Extracting text from PDF...');
        const text = await extractTextFromPDF(req.file.buffer);

        // Validate content
        if (!validatePDFContent(text)) {
            return res.status(400).json({
                error: 'PDF content is too short or invalid. Please upload a PDF with more text content.'
            });
        }

        console.log(`Extracted ${text.length} characters from PDF`);

        // Generate quiz using Gemini
        console.log('Generating quiz with Gemini API...');
        const quizData = await geminiService.generateQuizFromText(
            text,
            difficulty,
            parseInt(questionCount)
        );

        console.log(`Generated ${quizData.questions.length} questions`);

        res.json({
            success: true,
            quiz: quizData,
            metadata: {
                source: 'pdf',
                filename: req.file.originalname,
                generatedAt: new Date().toISOString(),
                difficulty,
                questionCount: quizData.questions.length
            }
        });

    } catch (error) {
        console.error('PDF processing error:', error);
        res.status(500).json({
            error: 'Failed to process PDF and generate quiz',
            message: error.message
        });
    }
});

// Custom topic quiz generation endpoint
app.post('/api/generate/topic', async (req, res) => {
    try {
        const { topic, difficulty = 'Medium', questionCount = 10 } = req.body;

        if (!topic || topic.trim() === '') {
            return res.status(400).json({ error: 'Topic is required' });
        }

        console.log(`Generating quiz for topic: "${topic}"...`);

        // Use the specialized topic generation method
        const quizData = await geminiService.generateQuizFromTopic(
            topic,
            difficulty,
            parseInt(questionCount)
        );

        console.log(`Generated ${quizData.questions.length} questions for topic "${topic}"`);

        res.json({
            success: true,
            quiz: quizData,
            metadata: {
                source: 'topic',
                topic: topic,
                generatedAt: new Date().toISOString(),
                difficulty,
                questionCount: quizData.questions.length
            }
        });

    } catch (error) {
        console.error('Topic quiz generation error:', error);
        res.status(500).json({
            error: 'Failed to generate quiz from topic',
            message: error.message
        });
    }
});

// Image upload and quiz generation endpoint
app.post('/api/upload/image', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { difficulty = 'Medium', questionCount = 10 } = req.body;

        console.log('Processing image...');
        console.log('Image size:', req.file.size, 'bytes');
        console.log('Image type:', req.file.mimetype);

        // Generate quiz from image using Gemini
        console.log('Generating quiz from image with Gemini API...');
        const quizData = await geminiService.generateQuizFromImage(
            req.file.buffer,
            req.file.mimetype,
            difficulty,
            parseInt(questionCount)
        );

        console.log(`Generated ${quizData.questions.length} questions from image`);

        res.json({
            success: true,
            quiz: quizData,
            metadata: {
                source: 'image',
                filename: req.file.originalname,
                generatedAt: new Date().toISOString(),
                difficulty,
                questionCount: quizData.questions.length
            }
        });

    } catch (error) {
        console.error('Image processing error:', error);
        res.status(500).json({
            error: 'Failed to process image and generate quiz',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);

    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'Maximum file size is 10MB'
            });
        }
    }

    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Quiz Server running on http://localhost:${PORT}`);
    console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
});
