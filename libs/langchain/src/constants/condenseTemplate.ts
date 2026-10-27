export const CONDENSE_TEMPLATE = `Given a conversation history and a follow-up question, please:

1. Identify the language of the follow-up question and provide the ISO 639-1 language code (e.g., 'en', 'es', 'ru', 'zh', 'ja')
2. Rewrite the follow-up question as a clear, standalone question in the same language, incorporating relevant context from the conversation history when necessary
3. If the question is a greeting (hello, hi, good morning, etc.), keep it as is

IMPORTANT: The rewritten question should only seek information that could be found in uploaded documents or conversation history.

Conversation History:
{chat_history}

Follow-up Question: {question}

Please respond in the following format:
Language: <ISO 639-1 code>
Rewritten Question: <your rewritten question>`;
