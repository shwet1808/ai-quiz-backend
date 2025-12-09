import { GoogleGenerativeAI } from '@google/generative-ai';
import { createQuizPrompt, createImageQuizPrompt, createTopicQuizPrompt } from '../prompts/quizPrompt.js';

class GeminiService {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateQuizFromText(text, difficulty = 'Medium', questionCount = 10) {
        try {
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash-001',
                generationConfig: { responseMimeType: 'application/json' }
            });
            const prompt = createQuizPrompt(text, difficulty, questionCount);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text();

            responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const quizData = JSON.parse(responseText);

            if (!quizData.questions || !Array.isArray(quizData.questions)) {
                throw new Error('Invalid quiz structure: missing questions array');
            }

            quizData.questions = quizData.questions.map((q, index) => {
                // Generate dynamic image URL if visual keyword is present
                let imageUrl = q.imageUrl || null;
                if (!imageUrl && q.visual_keyword) {
                    imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(q.visual_keyword)}?width=800&height=600&nologo=true`;
                }

                return {
                    id: q.id || index + 1,
                    question: q.question || '',
                    options: q.options || [],
                    correctAnswer: q.correctAnswer ?? 0,
                    explanation: q.explanation || '',
                    difficulty: q.difficulty || difficulty,
                    topic: q.topic || 'General',
                    imageUrl: imageUrl
                };
            });

            return quizData;
        } catch (error) {
            console.error('Error generating quiz from text:', error);
            throw new Error(`Failed to generate quiz: ${error.message}`);
        }
    }

    async generateQuizFromTopic(topic, difficulty = 'Medium', questionCount = 10) {
        try {
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash-001',
                generationConfig: { responseMimeType: 'application/json' }
            });
            const prompt = createTopicQuizPrompt(topic, difficulty, questionCount);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text();

            responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const quizData = JSON.parse(responseText);

            if (!quizData.questions || !Array.isArray(quizData.questions)) {
                throw new Error('Invalid quiz structure: missing questions array');
            }

            quizData.questions = quizData.questions.map((q, index) => {
                // Generate dynamic image URL if visual keyword is present
                let imageUrl = q.imageUrl || null;
                if (!imageUrl && q.visual_keyword) {
                    imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(q.visual_keyword)}?width=800&height=600&nologo=true`;
                }

                return {
                    id: q.id || index + 1,
                    question: q.question || '',
                    options: q.options || [],
                    correctAnswer: q.correctAnswer ?? 0,
                    explanation: q.explanation || '',
                    difficulty: q.difficulty || difficulty,
                    topic: q.topic || topic,
                    imageUrl: imageUrl
                };
            });

            return quizData;
        } catch (error) {
            console.error('Error generating quiz from topic:', error);
            throw new Error(`Failed to generate quiz from topic: ${error.message}`);
        }
    }

    async generateQuizFromImage(imageBuffer, mimeType, difficulty = 'Medium', questionCount = 10) {
        try {
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash-001',
                generationConfig: { responseMimeType: 'application/json' }
            });

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: mimeType
                }
            };

            const descriptionPrompt = 'Describe this image in detail. Include all visible elements, text, diagrams, concepts, and any educational content present. Be comprehensive and specific.';

            const descriptionResult = await model.generateContent([descriptionPrompt, imagePart]);
            const descriptionResponse = await descriptionResult.response;
            const imageDescription = descriptionResponse.text();

            const quizPrompt = createImageQuizPrompt(imageDescription, difficulty, questionCount);

            const quizResult = await model.generateContent(quizPrompt);
            const quizResponse = await quizResult.response;
            let responseText = quizResponse.text();

            responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const quizData = JSON.parse(responseText);

            if (!quizData.questions || !Array.isArray(quizData.questions)) {
                throw new Error('Invalid quiz structure: missing questions array');
            }

            quizData.questions = quizData.questions.map((q, index) => {
                // Generate dynamic image URL if visual keyword is present
                let imageUrl = q.imageUrl || null;
                if (!imageUrl && q.visual_keyword) {
                    imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(q.visual_keyword)}?width=800&height=600&nologo=true`;
                }

                return {
                    id: q.id || index + 1,
                    question: q.question || '',
                    options: q.options || [],
                    correctAnswer: q.correctAnswer ?? 0,
                    explanation: q.explanation || '',
                    difficulty: q.difficulty || difficulty,
                    topic: q.topic || 'Visual Analysis',
                    imageUrl: imageUrl
                };
            });

            return quizData;
        } catch (error) {
            console.error('Error generating quiz from image:', error);
            throw new Error(`Failed to generate quiz from image: ${error.message}`);
        }
    }

    async testConnection() {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
            const result = await model.generateContent('Say "API is working" if you can read this.');
            const response = await result.response;
            return { success: true, message: 'connected' };
        } catch (error) {
            console.error('Gemini API connection check failed:', error);
            return { success: false, message: error.message };
        }
    }
}

export default GeminiService;