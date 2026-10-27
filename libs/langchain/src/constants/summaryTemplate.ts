export const SUMMARY_TEMPLATE = `
You are an expert in summarizing documents stored in a database.
Your goal is to create a concise and accurate summary of a document.
Below you find the full text of a document retrieved from the database:

--------
{text}
--------

The document text will also serve as the basis for a question-and-answer bot.
Provide a summary of the document and include a list of specific example questions and answers that could be asked about the document. Ensure the questions are detailed and directly tied to the content.

Total output will be a summary of the document and a list of example questions the user could ask about the document.

SUMMARY AND QUESTIONS:
`;
