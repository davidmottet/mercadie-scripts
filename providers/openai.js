import OpenAI from 'openai';
import { AIProvider } from './base.js';

export class OpenAIProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.openai = new OpenAI({ apiKey });
  }

  async generateCompletion(prompt) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "system", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    });
    return JSON.parse(completion.choices[0].message.content);
  }
} 