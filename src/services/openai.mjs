import OpenAI from 'openai';

const EMBEDDING_MODEL = "text-embedding-ada-002";

/**
 * OpenAI Service
 */
export default class OpenAI {

  /**
   * Constructor
   */
  constructor({ apiKey }) {
    this.ai = new OpenAI({ apiKey });
  }

  /**
   * Create Text Embedding
   */
  async embed(text) {
    const result = await this.ai.embeddings.create({
      input: text,
      model: EMBEDDING_MODEL
    });
    return result.data[0].embedding;
  }

}
