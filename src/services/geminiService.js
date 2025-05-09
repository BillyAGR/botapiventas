import config from '../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prompItem from '../prompts/promptItem.js';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

// History for user (in memory)
const conversationHistory = {};

//Prompt base personalised for the assistant
const promptBase = prompItem;

const geminiService = async (userId, message) => {
    try {
        if (!userId || !message) {
            throw new Error('Faltan datos necesarios: userId o message.');
        }

        // Create session if it does not exist
        if (!conversationHistory[userId]) {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const chat = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: promptBase }],
                    },
                    {
                        role: 'model',
                        parts: [{ text: 'Entendido.' }],
                    },
                ],
                generationConfig: {
                    temperature: 0.4,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 1024,
                },
            });

            conversationHistory[userId] = chat;
        }

        const chat = conversationHistory[userId];
        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error('API KEY:', config.GEMINI_API_KEY);
        console.error('Error en geminiService:', error);
        return 'Lo siento, ocurrió un error procesando tu solicitud.';
    }
};

export default geminiService;
