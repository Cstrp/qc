module.exports = {
    apps: [
        {
            name: 'api',
            script: './dist/apps/api/main.js',
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '1G',
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: 'production',
            },
            namespace: 'api',
        },
        {
            name: 'file_processor',
            script: './dist/apps/file-processor/main.js',
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '1G',
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: 'production',
            },
            namespace: 'file_processor',
        },
        {
            name: 'tg_bot_runner',
            script: './dist/apps/tg-bot-runner/main.js',
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '1G',
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: 'production',
            },
            namespace: 'tg_bot_runner',
        },
    ],
};
