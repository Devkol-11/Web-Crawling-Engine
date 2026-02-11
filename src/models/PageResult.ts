import { UrlEntity } from './UrlEntity.js';

/**
 * PageResult — Represents the data collected from crawling a single page.
 * Immutable after construction.
 */
export class PageResult {
    public readonly url: UrlEntity;
    public readonly title: string | null;
    public readonly description: string | null;
    public readonly headings: string[];
    public readonly links: UrlEntity[];
    public readonly statusCode: number;
    public readonly crawledAt: Date;
    public readonly depth: number;
    public readonly responseTimeMs: number;
    public readonly contentLength: number;
    public readonly jobId: string;

    constructor(params: {
        url: UrlEntity;
        title: string | null;
        description: string | null;
        headings?: string[];
        links: UrlEntity[];
        statusCode: number;
        depth: number;
        responseTimeMs: number;
        contentLength?: number;
        jobId: string;
    }) {
        this.url = params.url;
        this.title = params.title;
        this.description = params.description;
        this.headings = params.headings ?? [];
        this.links = params.links;
        this.statusCode = params.statusCode;
        this.crawledAt = new Date();
        this.depth = params.depth;
        this.responseTimeMs = params.responseTimeMs;
        this.contentLength = params.contentLength ?? 0;
        this.jobId = params.jobId;
    }

    // ── Derived ──────────────────────────────────────────────

    /**
     * Number of outgoing links discovered on this page.
     */
    public get linkCount(): number {
        return this.links.length;
    }

    /**
     * Whether the HTTP response indicates success.
     */
    public get isSuccessful(): boolean {
        return this.statusCode >= 200 && this.statusCode < 400;
    }

    // ── Serialization ────────────────────────────────────────

    public toJSON(): object {
        return {
            url: this.url.normalized,
            title: this.title,
            description: this.description,
            headings: this.headings,
            links: this.links.map((l) => l.normalized),
            linkCount: this.linkCount,
            statusCode: this.statusCode,
            isSuccessful: this.isSuccessful,
            crawledAt: this.crawledAt.toISOString(),
            depth: this.depth,
            responseTimeMs: this.responseTimeMs,
            contentLength: this.contentLength,
            jobId: this.jobId
        };
    }
}
