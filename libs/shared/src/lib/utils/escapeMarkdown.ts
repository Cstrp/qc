import telegramify from 'telegramify-markdown';

export const escapeMarkdown = (input: string): string => {
    let formattedText = '';

    if (input.startsWith('```') || input.includes('markdown')) {
        formattedText = telegramify(input.replace('```', '').replace('markdown', ''), 'escape');
    } else {
        formattedText = telegramify(input, 'escape').replace(/\*\*\*/g, '');
    }

    return formattedText;
};
