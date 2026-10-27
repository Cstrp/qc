import { BaseDocumentLoader } from '@langchain/core/document_loaders/base';
import { Document } from '@langchain/core/documents';
import { readFile } from 'fs/promises';
import PdfParse from 'pdf-parse';

type PdfLoader = typeof PdfParse;

let cachedPdfLoader: PdfLoader | null = null;

async function getPdfLoader(): Promise<PdfLoader> {
    if (cachedPdfLoader) {
        return cachedPdfLoader;
    }

    try {
        cachedPdfLoader = (await import('pdf-parse')).default;

        return cachedPdfLoader;
    } catch (error) {
        console.error('Failed to load pdf-parse:', error);
        throw new Error('Failed to load pdf-parse. Please install it with: pnpm add pdf-parse');
    }
}

abstract class BufferLoader extends BaseDocumentLoader {
    constructor(protected readonly path: string | Blob, protected readonly pdf: PdfLoader) {
        super();
    }

    protected abstract parse(buffer: Buffer, metadata: Document['metadata']): Promise<Document[]>;

    public async load(): Promise<Document[]> {
        if (!this.path) {
            throw new Error('Path or Blob is required');
        }

        const buffer =
            typeof this.path === 'string'
                ? await readFile(this.path)
                : Buffer.from(await this.path.arrayBuffer());

        const metadata =
            typeof this.path === 'string'
                ? { source: this.path }
                : { source: 'blob', blobType: this.path.type || 'unknown' };

        return this.parse(buffer, metadata);
    }
}

export class CustomPdfLoader extends BufferLoader {
    public async parse(buffer: Buffer, metadata: Document['metadata']): Promise<Document[]> {
        const pdf = await getPdfLoader();
        const result = await pdf(buffer);

        return [
            new Document({
                pageContent: result.text,
                metadata: {
                    ...metadata,
                    pdf_numpages: result.numpages,
                    pdf_info: result.info,
                    pdf_version: result.version,
                    pdf_numrender: result.numrender,
                },
            }),
        ];
    }
}
