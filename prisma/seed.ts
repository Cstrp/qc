import { FILE_STATUS, MESSAGE_ROLE, PrismaClient } from '@prisma/client';
import { randomUUID as uuidv4 } from 'crypto';

const prisma = new PrismaClient();

function generateDates() {
    const today = new Date();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeekDates = [];
    for (let i = 2; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        lastWeekDates.push(date);
    }

    const lastMonthDates = [];
    for (let i = 7; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        lastMonthDates.push(date);
    }

    const lastCoupleMonthsDates = [];
    for (let i = 1; i <= 2; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        lastCoupleMonthsDates.push(date);
    }

    const lastYearDates = [];
    for (let i = 1; i <= 5; i++) {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        date.setMonth(i * 2 - 1);
        lastYearDates.push(date);
    }

    return {
        today,
        yesterday: Array(2).fill(yesterday), 
        lastWeek: lastWeekDates.slice(0, 4), 
        lastMonth: lastMonthDates.slice(0, 3), 
        lastCoupleMonths: lastCoupleMonthsDates, 
        lastYear: lastYearDates,
    };
}

const companyIds = [
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '11111111-1111-4111-8111-222222222222',
    '11111111-1111-4111-8111-333333333333',
];

const userIds = companyIds.flatMap((companyId: string) =>
    Array.from({ length: 5 }, () => uuidv4()),
);

// Main seed function
async function main() {
    console.log('Starting seed...');

    // Generate dates for chat updatedAt fields
    const dates = generateDates();
    // Flatten all dates into a single array
    const allDates = [
        dates.today,
        ...dates.yesterday,
        ...dates.lastWeek,
        ...dates.lastMonth,
        ...dates.lastCoupleMonths,
        ...dates.lastYear,
    ];
    console.log(`Generated ${allDates.length} different dates for chats`);

    // Create 5 companies (we don't actually create company records, just use the IDs)
    console.log('Creating companies and users...');

    // Create files for each company
    console.log('Creating files...');
    const files = [];
    const mimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const fileSizes = [1024, 2048, 4096, 8192, 16384, 32768, 65536];
    const fileStatuses = [
        FILE_STATUS.PENDING,
        FILE_STATUS.PROCESSING,
        FILE_STATUS.COMPLETED,
        FILE_STATUS.FAILED,
    ];

    for (let companyIndex = 0; companyIndex < companyIds.length; companyIndex++) {
        const companyId = companyIds[companyIndex];

        // Create 10 files for each company
        for (let fileIndex = 0; fileIndex < 10; fileIndex++) {
            const fileId = uuidv4();
            const mimeType = mimeTypes[fileIndex % mimeTypes.length];
            const extension =
                mimeType === 'application/pdf'
                    ? 'pdf'
                    : mimeType === 'application/msword'
                      ? 'doc'
                      : mimeType ===
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        ? 'docx'
                        : mimeType === 'text/plain'
                          ? 'txt'
                          : mimeType === 'text/csv'
                            ? 'csv'
                            : mimeType === 'application/vnd.ms-excel'
                              ? 'xls'
                              : mimeType ===
                                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                ? 'xlsx'
                                : '';

            const fileName = `Test file_${fileIndex + 1}_Company_${companyIndex + 1}.${extension}`;
            const size = fileSizes[fileIndex % fileSizes.length];
            const status = fileStatuses[fileIndex % fileStatuses.length];

            const file = await prisma.file.create({
                data: {
                    id: fileId,
                    name: fileName,
                    mimeType,
                    size,
                    storageKey: `company_${companyId}/files/${fileId}/${fileName}`,
                    status,
                    companyId,
                },
            });

            // Create embeddings for completed files
            if (status === FILE_STATUS.COMPLETED) {
                // Create 3-5 embeddings for each completed file
                const numEmbeddings = Math.floor(Math.random() * 3) + 3; // 3-5 embeddings

                for (let i = 0; i < numEmbeddings; i++) {
                    const content = `Content chunk ${i + 1} from file ${fileName}`;
                    const checksum = `checksum_${fileId}_${i}`;
                    const metadata = {
                        page: i + 1,
                        fileName,
                        fileId,
                        chunkIndex: i,
                    };

                    await prisma.embeddings.create({
                        data: {
                            id: uuidv4(),
                            content,
                            metadata,
                            checksum,
                            fileId,
                        },
                    });
                }

                console.log(`Created embeddings for file ${fileName}`);
            }

            files.push(file);
            console.log(`Created file ${fileName} for company ${companyIndex + 1}`);
        }
    }

    console.log(`Created ${files.length} files for ${companyIds.length} companies`);

    // Create 5 knowledge bases for each company
    console.log('Creating knowledge bases...');
    const knowledgeBases = [];

    for (let companyIndex = 0; companyIndex < companyIds.length; companyIndex++) {
        const companyId = companyIds[companyIndex];

        for (let kbIndex = 0; kbIndex < 5; kbIndex++) {
            const knowledgeBase = await prisma.knowledgeBase.create({
                data: {
                    id: uuidv4(),
                    name: `Knowledge Base ${kbIndex + 1} for Company ${companyIndex + 1}`,
                    companyId,
                },
            });

            knowledgeBases.push(knowledgeBase);

            // Associate some files with this knowledge base
            // Get files for this company
            const companyFiles = files.filter((file) => file.companyId === companyId);

            // Associate 3-5 random files with this knowledge base
            const numFilesToAssociate = Math.floor(Math.random() * 3) + 3; // 3-5 files
            const filesToAssociate = [...companyFiles]
                .sort(() => 0.5 - Math.random())
                .slice(0, numFilesToAssociate);

            for (const file of filesToAssociate) {
                await prisma.knowledgeBaseFile.create({
                    data: {
                        knowledgeBaseId: knowledgeBase.id,
                        fileId: file.id,
                    },
                });
                console.log(
                    `Associated file ${file.name} with knowledge base ${knowledgeBase.name}`,
                );
            }

            // For each knowledge base, we need to create chats with the specified date distribution
            // Create a copy of allDates for this knowledge base to ensure each KB has the full range of dates
            const kbDates = [...allDates];

            // Create 10 chats for each knowledge base (should be at least 17 to cover all date categories)
            for (let chatIndex = 0; chatIndex < 17; chatIndex++) {
                // Get a user ID from the same company
                const userIdIndex = companyIndex * 5 + (chatIndex % 5);
                const userId = userIds[userIdIndex];

                // Get a date for this chat based on its index within the knowledge base
                // This ensures each knowledge base has the same distribution of dates
                const updatedAt = kbDates[chatIndex % kbDates.length];

                const chat = await prisma.chat.create({
                    data: {
                        id: uuidv4(),
                        title: `Chat ${chatIndex + 1} for KB ${kbIndex + 1}`,
                        knowledgeBaseId: knowledgeBase.id,
                        userId,
                        updatedAt,
                        createdAt: updatedAt,
                    },
                });

                // Create 10 messages for each chat
                const messages = [];
                for (let msgIndex = 0; msgIndex < 10; msgIndex++) {
                    // Alternate between user and assistant messages
                    const role: MESSAGE_ROLE =
                        msgIndex % 2 === 0 ? MESSAGE_ROLE.USER : MESSAGE_ROLE.ASSISTANT;

                    const message = await prisma.chatMessage.create({
                        data: {
                            id: uuidv4(),
                            text: `${role === MESSAGE_ROLE.USER ? 'Question' : 'Answer'} ${
                                msgIndex + 1
                            } in Chat ${chatIndex + 1}`,
                            role,
                            chatId: chat.id,
                            updatedAt,
                            createdAt: updatedAt,
                        },
                    });

                    messages.push(message);
                }

                console.log(
                    `Created chat ${chatIndex + 1} with ${
                        messages.length
                    } messages for knowledge base ${kbIndex + 1} of company ${
                        companyIndex + 1
                    }, updatedAt: ${updatedAt.toISOString()}`,
                );
            }
        }
    }

    // Print summary of chat date distribution
    console.log('\nChat date distribution summary per knowledge base:');
    console.log('- Today:', 1);
    console.log('- Yesterday:', dates.yesterday.length);
    console.log('- Last 7 days:', dates.lastWeek.length);
    console.log('- Last 30 days:', dates.lastMonth.length);
    console.log('- Last couple months:', dates.lastCoupleMonths.length);
    console.log('- Last year:', dates.lastYear.length);
    console.log('Total dates per knowledge base:', allDates.length);

    // Calculate total chats created
    const totalKnowledgeBases = companyIds.length * 5; // 5 knowledge bases per company
    const totalChats = totalKnowledgeBases * 17; // 17 chats per knowledge base
    console.log(`\nTotal knowledge bases created: ${totalKnowledgeBases}`);
    console.log(`Total chats created: ${totalChats}`);

    // Calculate total files created and associations
    const totalFiles = files.length;
    const totalFileAssociations = await prisma.knowledgeBaseFile.count();
    console.log(`\nTotal files created: ${totalFiles}`);
    console.log(`Total file-knowledge base associations created: ${totalFileAssociations}`);

    // Print file status distribution
    const fileStatusCounts = await Promise.all(
        Object.values(FILE_STATUS).map(async (status) => {
            const count = await prisma.file.count({ where: { status } });
            return { status, count };
        }),
    );

    console.log('\nFile status distribution:');
    fileStatusCounts.forEach(({ status, count }) => {
        console.log(`- ${status}: ${count}`);
    });

    // Calculate total embeddings created
    const totalEmbeddings = await prisma.embeddings.count();
    const filesWithEmbeddings = await prisma.file.count({
        where: {
            embeddings: {
                some: {},
            },
        },
    });

    console.log('\nEmbeddings summary:');
    console.log(`- Total embeddings created: ${totalEmbeddings}`);
    console.log(`- Files with embeddings: ${filesWithEmbeddings}`);
    console.log(
        `- Average embeddings per file: ${
            filesWithEmbeddings > 0 ? (totalEmbeddings / filesWithEmbeddings).toFixed(2) : 0
        }`,
    );

    // Create Telegram bots and related data
    console.log('\nCreating Telegram bots and related data...');

    // Use the specified company ID
    const telegramCompanyId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    // Create 3 Telegram bots for the specified company
    const telegramBots = [];
    const botNames = ['CustomerSupportBot', 'SalesAssistantBot', 'ProductInfoBot'];
    const botTokens = [
        '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        '654321:XYZ-ABC7890defG-zyx57W2v1u456ew22',
        '987654:LMN-OPQ4567rstuV-zyx57W2v1u789ew33',
    ];

    const botUuids = [
        'b8f51b34-e227-46d7-9759-b5fd2eacd919',
        'f8cc0ee5-e156-475e-8526-f856ba1fb6b4',
        'f9c77cda-1d24-4848-8ba6-3ea23b3280ad',
    ];

    for (let i = 0; i < 3; i++) {
        const botId = botUuids[i];
        const bot = await prisma.telegramBot.create({
            data: {
                id: botId,
                name: botNames[i],
                token: botTokens[i],
                firstName: botNames[i].replace('Bot', ''),
                username: botNames[i].toLowerCase(),
                status: i === 0 ? 'ONLINE' : i === 1 ? 'IDLE' : 'OFFLINE',
                isEnabled: i !== 2, // Third bot is disabled
                canJoinGroups: true,
                canReadAllGroupMessages: true,
                supportsInlineQueries: i === 1, // Only second bot supports inline queries
                canConnectToBusiness: i === 0, // Only first bot can connect to business
                hasMainWebApp: i === 0, // Only first bot has main web app
                companyId: telegramCompanyId,
                lastUsedAt: i === 2 ? null : new Date(),
            },
        });

        telegramBots.push(bot);
        console.log(`Created Telegram bot: ${bot.name}`);

        // Create a knowledge base for this bot
        if ([0, 2].includes(i)) {
            await prisma.knowledgeBase.create({
                data: {
                    id: uuidv4(),
                    name: `${bot.name} Knowledge Base`,
                    botId: bot.id,
                    companyId: telegramCompanyId,
                },
            });
            console.log(`Created knowledge base for bot: ${bot.name}`);
        }

        // Create allowed users for this bot
        const allowedUsernames = [
            'john_doe',
            'jane_smith',
            'alex_johnson',
            'sarah_williams',
            'michael_brown',
        ];
        const allowedUsers = [];

        for (let j = 0; j < 3; j++) {
            const username = allowedUsernames[i * 1 + j];
            if (username) {
                const allowedUser = await prisma.telegramAllowedUser.create({
                    data: {
                        id: uuidv4(),
                        botId: bot.id,
                        username: username,
                    },
                });

                allowedUsers.push(allowedUser);
                console.log(`Created allowed user: ${username} for bot: ${bot.name}`);
            }
        }

        // Create Telegram users who have interacted with this bot
        const telegramUsers = [];
        const firstNames = ['John', 'Jane', 'Alex', 'Sarah', 'Michael'];
        const lastNames = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown'];

        for (let j = 0; j < 3; j++) {
            const userId = uuidv4();
            const telegramId = BigInt(1000000000 + i * 10 + j);
            const firstName = firstNames[i * 1 + j];
            const lastName = lastNames[i * 1 + j];
            const username = allowedUsernames[i * 1 + j];

            if (firstName && lastName && username) {
                const user = await prisma.telegramUser.create({
                    data: {
                        id: userId,
                        telegramId: telegramId,
                        firstName: firstName,
                        lastName: lastName,
                        username: username,
                        languageCode: 'en',
                        isBot: false,
                        botId: bot.id,
                    },
                });

                telegramUsers.push(user);
                console.log(`Created Telegram user: ${firstName} ${lastName} for bot: ${bot.name}`);

                // Create messages between this user and the bot
                const messageCount = 5; // 5 messages per user

                for (let k = 0; k < messageCount; k++) {
                    const role = k % 2 === 0 ? 'USER' : 'ASSISTANT';
                    const text =
                        role === 'USER'
                            ? `Hello, I have a question about ${k + 1}`
                            : `I'm happy to help with your question about ${k + 1}. What would you like to know?`;

                    await prisma.telegramMessage.create({
                        data: {
                            id: uuidv4(),
                            text: text,
                            role: role,
                            botId: bot.id,
                            userId: user.id,
                        },
                    });
                }

                console.log(
                    `Created ${messageCount} messages between ${firstName} and bot: ${bot.name}`,
                );
            }
        }
    }

    // Print summary of Telegram data
    const totalBots = await prisma.telegramBot.count();
    const totalUsers = await prisma.telegramUser.count();
    const totalMessages = await prisma.telegramMessage.count();
    const totalAllowedUsers = await prisma.telegramAllowedUser.count();

    console.log('\nTelegram data summary:');
    console.log(`- Total bots created: ${totalBots}`);
    console.log(`- Total users created: ${totalUsers}`);
    console.log(`- Total messages created: ${totalMessages}`);
    console.log(`- Total allowed users created: ${totalAllowedUsers}`);

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
