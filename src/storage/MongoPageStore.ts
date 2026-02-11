import mongoose, { Schema, Document } from 'mongoose';
import { IPageStore } from './IPageStore.js';
import { PageResult } from '../models/PageResult.js';
import { UrlEntity } from '../models/UrlEntity.js';
import { Logger } from '../utils/Logger.js';

/**
 * Mongoose document shape for a crawled page.
 */
interface IPageDocument extends Document {
    jobId: string;
    url: string;
    title: string | null;
    description: string | null;
    headings: string[];
    links: string[];
    statusCode: number;
    depth: number;
    responseTimeMs: number;
    contentLength: number;
    crawledAt: Date;
}

const PageSchema = new Schema<IPageDocument>(
    {
        jobId: { type: String, required: true, index: true },
        url: { type: String, required: true },
        title: { type: String, default: null },
        description: { type: String, default: null },
        headings: { type: [String], default: [] },
        links: { type: [String], default: [] },
        statusCode: { type: Number, required: true },
        depth: { type: Number, required: true },
        responseTimeMs: { type: Number, required: true },
        contentLength: { type: Number, default: 0 },
        crawledAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

const PageModel = mongoose.model<IPageDocument>('Page', PageSchema);

/**
 * MongoPageStore — MongoDB/Mongoose-backed implementation of IPageStore.
 * Suitable for production use with durable storage.
 */
export class MongoPageStore implements IPageStore {
    private readonly logger = Logger.create('MongoPageStore');

    /**
     * Connect to MongoDB.
     */
    public static async connect(uri: string): Promise<void> {
        await mongoose.connect(uri);
    }

    /**
     * Disconnect from MongoDB.
     */
    public static async disconnect(): Promise<void> {
        await mongoose.disconnect();
    }

    public async save(page: PageResult): Promise<void> {
        const doc = new PageModel({
            jobId: page.jobId,
            url: page.url.normalized,
            title: page.title,
            description: page.description,
            headings: page.headings,
            links: page.links.map((l) => l.normalized),
            statusCode: page.statusCode,
            depth: page.depth,
            responseTimeMs: page.responseTimeMs,
            contentLength: page.contentLength,
            crawledAt: page.crawledAt
        });
        await doc.save();
        this.logger.debug(`Saved page ${page.url.normalized}`);
    }

    public async findByJobId(jobId: string): Promise<PageResult[]> {
        const docs = await PageModel.find({ jobId }).lean();
        return docs.map((doc) => this.toPageResult(doc));
    }

    public async count(jobId: string): Promise<number> {
        return await PageModel.countDocuments({ jobId });
    }

    // ── Private ──────────────────────────────────────────────

    private toPageResult(doc: any): PageResult {
        const url = UrlEntity.from(doc.url)!;
        const links = (doc.links as string[])
            .map((l) => UrlEntity.from(l))
            .filter((l): l is UrlEntity => l !== null);

        return new PageResult({
            url,
            title: doc.title,
            description: doc.description,
            headings: doc.headings ?? [],
            links,
            statusCode: doc.statusCode,
            depth: doc.depth,
            responseTimeMs: doc.responseTimeMs,
            contentLength: doc.contentLength ?? 0,
            jobId: doc.jobId
        });
    }
}
