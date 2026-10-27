export const formatArgs = <T>(args: T): string => {
    if (!args || Object.keys(args).length === 0) return 'None';

    const simplifiedArgs: Record<string, string> = {};

    for (const [key, value] of Object.entries(args)) {
        if (typeof value === 'object' && value !== null) {
            const subKeys = Object.keys(value).join(', ');

            simplifiedArgs[key] = `{${subKeys}}`;
        } else {
            simplifiedArgs[key] = String(value).substring(0, 50);
        }
    }

    return JSON.stringify(simplifiedArgs).replace(/"/g, "'");
};
