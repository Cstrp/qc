import { CipherGCM, createCipheriv, createDecipheriv, DecipherGCM } from 'crypto';
import { config } from 'dotenv';

config();

enum EncryptionMode {
    AES_256_GCM = 'aes-256-gcm',
    AES_256_CBC = 'aes-256-cbc',
}

const algorithmRaw = process.env['ENCRYPTION_ALGORITHM'];

const algorithm: EncryptionMode = Object.values(EncryptionMode).includes(
    algorithmRaw as EncryptionMode,
)
    ? (algorithmRaw as EncryptionMode)
    : EncryptionMode.AES_256_GCM;

const encryptionKey = process.env['ENCRYPTION_KEY'];
const encryptionIV = process.env['ENCRYPTION_IV'];

if (!encryptionKey || !encryptionIV) {
    throw new Error('Encryption key and IV must be provided in environment variables');
}

const keyBuffer = Buffer.from(encryptionKey, 'hex');

if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
}

const key = keyBuffer;

const ivLength = algorithm === EncryptionMode.AES_256_GCM ? 12 : 16;
const ivBuffer = Buffer.from(encryptionIV, 'hex');

if (ivBuffer.length !== ivLength) {
    throw new Error(
        `IV must be ${ivLength} bytes (${ivLength * 2} hex characters) for ${algorithm}`,
    );
}

const iv = ivBuffer;

const encrypt = (value: string | number = '', isInt = false): string => {
    if (!value) {
        throw new Error('Value to encrypt is required');
    }

    const cipher = createCipheriv(algorithm, key, iv) as CipherGCM;
    let inputBuffer: Buffer;

    if (isInt) {
        cipher.setAutoPadding(false);
        inputBuffer = Buffer.allocUnsafe(8);
        inputBuffer.writeBigUInt64BE(BigInt(value));
    } else {
        inputBuffer = Buffer.from(String(value), 'utf8');
    }

    const encrypted = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);

    if (algorithm === EncryptionMode.AES_256_GCM) {
        const authTag = cipher.getAuthTag();
        return Buffer.concat([encrypted, authTag]).toString('base64');
    }

    return encrypted.toString('base64');
};

const decrypt = (token = '', isInt = false): string => {
    if (!token) {
        throw new Error('Token to decrypt is required');
    }

    const buffer = Buffer.from(token, 'base64');

    let encryptedData: Buffer;
    let authTag: Buffer | undefined;

    if (algorithm === EncryptionMode.AES_256_GCM) {
        const authTagLength = 16;

        if (buffer.length < authTagLength) {
            throw new Error('Token too short to contain auth tag for AES-256-GCM');
        }
        encryptedData = buffer.subarray(0, buffer.length - authTagLength);
        authTag = buffer.subarray(buffer.length - authTagLength);
    } else {
        encryptedData = buffer;
    }

    const decipher = createDecipheriv(algorithm, key, iv) as DecipherGCM;

    if (algorithm === EncryptionMode.AES_256_GCM && authTag) {
        decipher.setAuthTag(authTag);
    }
    if (isInt) {
        decipher.setAutoPadding(false);
    }

    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    const result = isInt ? decrypted.readBigUInt64BE(0).toString() : decrypted.toString('utf8');

    return result;
};

export { decrypt, encrypt };
