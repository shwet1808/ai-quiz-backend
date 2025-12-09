import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

async function listModels() {
    try {
        console.log('Fetching available models...');

        const key = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        let output = 'Available Models:\n';
        if (data.models) {
            data.models.forEach(m => {
                // Log all models to be safe, but highlight generation ones
                output += `- ${m.name} (${m.displayName})\n`;
                if (m.supportedGenerationMethods) {
                    output += `  Methods: ${m.supportedGenerationMethods.join(', ')}\n\n`;
                } else {
                    output += `  Methods: (unknown)\n\n`;
                }
            });
        } else {
            output += `Error: ${JSON.stringify(data, null, 2)}`;
        }

        await fs.writeFile('models.txt', output);
        console.log('Models written to models.txt');

    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
