import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { ChatOpenAI, ChatOpenAICallOptions } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { Document } from 'langchain/document';
import { CONDENSE_TEMPLATE, QA_TEMPLATE } from '../constants';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

@Injectable()
export class LangchainService {
    private readonly logger: Logger = new Logger(LangchainService.name);

    public async makeChain(
        client: ChatOpenAI<ChatOpenAICallOptions>,
        retriever: VectorStoreRetriever,
    ) {
        const condenseQuestionPrompt = ChatPromptTemplate.fromTemplate(CONDENSE_TEMPLATE);
        const qaPrompt = ChatPromptTemplate.fromTemplate(QA_TEMPLATE);
        const parser = new StringOutputParser();

        const parseCondensedResponse = (response: string) => {
            const lines = response.split('\n').map((line) => line.trim());

            const languageLine = lines.find((line) => line.startsWith('Language:'));
            const questionLine = lines.find((line) => line.startsWith('Rewritten Question:'));

            const detectedLanguage = languageLine?.split(':')[1]?.trim() || 'en';
            const refinedQuestion = questionLine?.split(':').slice(1).join(':').trim() || response;

            return { detectedLanguage, question: refinedQuestion };
        };

        const standaloneQuestionChain = RunnableSequence.from([
            condenseQuestionPrompt,
            client,
            parser,
            parseCondensedResponse,
        ]);

        const retrievalChain = retriever.pipe((docs) => this.combineDocuments(docs));

        const answerChain = RunnableSequence.from([
            {
                context: RunnableSequence.from([(input) => String(input.question), retrievalChain]),
                chat_history: (input) => String(input.chat_history),
                question: (input) => String(input.question),
            },
            qaPrompt,
            client,
            parser,
        ]);

        return RunnableSequence.from([
            {
                question: standaloneQuestionChain,
                chat_history: (input) => String(input.chat_history),
            },
            async (input) => {
                const { question, chat_history } = input;
                const { detectedLanguage, question: refinedQuestion } = question;

                this.logger.debug(`Detected language: ${detectedLanguage}`);

                return answerChain.stream({
                    question: refinedQuestion,
                    chat_history,
                });
            },
        ]);
    }

    private combineDocuments(documents: Document[], separator = '\n\n'): string {
        this.logger.verbose(`Combining ${documents.length} documents`);

        const filteredDocuments = documents.filter((d) => {
            const content = d.pageContent?.trim();

            return content.length > 50;
        });

        if (filteredDocuments.length === 0) {
            this.logger.warn('No relevant documents found. Skipping combination.');
            return '';
        }

        const combined = filteredDocuments
            .map((d, i) => `**Document ${i + 1}**: \n${d.pageContent}`)
            .join(separator);

        return combined;
    }
}
