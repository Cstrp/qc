import { OpenAIEmbeddings, OpenAIEmbeddingsParams } from '@langchain/openai';

export const getEmbeddingClient = (options?: Partial<OpenAIEmbeddingsParams>): OpenAIEmbeddings => {
    const openAIApiKey = process.env['OPENAI_API_KEY'];
    const modelName = process.env['OPENAI_EMBEDDING_MODEL'];

    if (!openAIApiKey || !modelName) {
        throw new Error('OpenAI API key or model name not provided. Please check your .env file');
    }

    const embeddings = new OpenAIEmbeddings({
        openAIApiKey,
        modelName,
        ...options,
    });

    return embeddings;
};
