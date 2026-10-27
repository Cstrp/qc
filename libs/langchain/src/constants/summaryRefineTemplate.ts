export const SUMMARY_REFINE_TEMPLATE = `
You are an expert in summarizing documents stored in a database.
Your goal is to refine an existing summary of a document based on new content.
We have provided an existing summary up to a certain point: {existing_answer}

Below you find the full text of a document retrieved from the database:

--------
{text}
--------

Given the new document text, refine the summary and update the example questions and answers.
The document text will also serve as the basis for a question-and-answer bot.
Provide a list of specific example questions and answers that could be asked about the document, ensuring they are detailed and tied to the content.
If the new text does not add useful information, return the original summary and questions unchanged.

Total output will be a summary of the document and a list of example questions the user could ask about the document.

SUMMARY AND QUESTIONS:
`;
