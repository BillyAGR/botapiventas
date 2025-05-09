import OpenAI from "openai";
import config from "../config/env.js";
import prompItem from '../prompts/promptItem.js';

const client = new OpenAI({
    apiKey: config.OPENAI_API_KEY,
});

const openAIService = async (message) => {
    try {
        const prompt = prompItem;
        const response = await client.chat.completions.create({
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: message }],
            model: 'gpt-4o'
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error en OpenAIService:', error);
        return "Lo siento, ocurrió un error procesando tu solicitud.";
    }
}

export default openAIService;