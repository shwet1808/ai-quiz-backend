import { GoogleGenerativeAI } from '@google/generative-ai';
import { createQuizPrompt, createImageQuizPrompt } from '../prompts/quizPrompt.js';

class GeminiService {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Use the working model from your test ✅
        this.modelName = 'gemini-2.5-flash';
    }

    /**
     * Generate quiz questions from text content
     */
    async generateQuizFromText(text, difficulty = 'Medium', questionCount = 10) {
        try {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                }
            });

            const prompt = createQuizPrompt(text, difficulty, questionCount);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text();

            // Clean up response
            responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Parse JSON response
            const quizData = JSON.parse(responseText);

            // Validate structure
            if (!quizData.questions || !Array.isArray(quizData.questions)) {
                throw new Error('Invalid quiz structure: missing questions array');
            }

            // Normalize questions
            quizData.questions = quizData.questions.map((q, index) => ({
                id: q.id || index + 1,
                question: q.question || '',
                options: q.options || [],
                correctAnswer: q.correctAnswer ?? 0,
                explanation: q.explanation || '',
                difficulty: q.difficulty || difficulty,
                topic: q.topic || 'General',
                imageUrl: q.imageUrl || null
            }));

            return quizData;
        } catch (error) {
            console.error('Error generating quiz from text:', error);
            throw new Error(`Failed to generate quiz: ${error.message}`);
        }
    }

    /**
     * Analyze image and generate quiz questions
     */
    async generateQuizFromImage(imageBuffer, mimeType, difficulty = 'Medium', questionCount = 10) {
        try {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.7,
                }
            });

            // Create image part
            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: mimeType
                }
            };

            // First, analyze the image
            const descriptionPrompt = 'Describe this image in detail. Include all visible elements, text, diagrams, concepts, and any educational content present. Be comprehensive and specific.';

            const descriptionResult = await model.generateContent([descriptionPrompt, imagePart]);
            const descriptionResponse = await descriptionResult.response;
            const imageDescription = descriptionResponse.text();

            console.log('Image analyzed successfully');

            // Generate quiz from description
            const quizPrompt = createImageQuizPrompt(imageDescription, difficulty, questionCount);
            const quizResult = await model.generateContent(quizPrompt);
            const quizResponse = await quizResult.response;
            let responseText = quizResponse.text();

            // Clean up response
            responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Parse JSON response
            const quizData = JSON.parse(responseText);

            // Validate and normalize
            if (!quizData.questions || !Array.isArray(quizData.questions)) {
                throw new Error('Invalid quiz structure: missing questions array');
            }

            quizData.questions = quizData.questions.map((q, index) => ({
                id: q.id || index + 1,
                question: q.question || '',
                options: q.options || [],
                correctAnswer: q.correctAnswer ?? 0,
                explanation: q.explanation || '',
                difficulty: q.difficulty || difficulty,
                topic: q.topic || 'Visual Analysis',
                imageUrl: q.imageUrl || null
            }));

            return quizData;
        } catch (error) {
            console.error('Error generating quiz from image:', error);
            throw new Error(`Failed to generate quiz from image: ${error.message}`);
        }
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.modelName });
            const result = await model.generateContent('Say "API is working" if you can read this.');
            const response = await result.response;
            const text = response.text();
            return text.toLowerCase().includes('working');
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }
}

export default GeminiService;