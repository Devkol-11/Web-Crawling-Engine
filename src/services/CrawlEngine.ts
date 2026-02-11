import pLimit from 'p-limit';
import { CrawlJob } from '../models/CrawlJob.js';
import { CrawlConfig } from '../models/CrawlConfig.js';
import { PageResult } from '../models/PageResult.js';
import { UrlEntity } from '../models/UrlEntity.js';
import { IUrlFrontier } from './interfaces/IUrlFrontier.js';
import { IPageStore } from './interfaces/IPageStore.js';
import { HttpClient } from './HttpClient.js';
import { HtmlParser } from './HtmlParser.js';
import { RobotsTxtService } from './RobotsTxtService.js';
import { Logger } from '../utils/Logger.js';

/**
 * CrawlEngine — The core orchestrator that drives the BFS crawl.
 *
 * Responsibilities:
 * - Manages CrawlJob lifecycle
 * - Enforces concurrency limits (p-limit)
 * - Tracks depth per URL
 * - Applies politeness delays between requests
 * - Checks robots.txt compliance
 * - Handles per-page errors without aborting the job
 */
export class CrawlEngine {
    private readonly jobs = new Map<string, CrawlJob>();
    private readonly httpClient: HttpClient;
    private readonly htmlParser: HtmlParser;
    private readonly frontier: IUrlFrontier;
    private readonly pageStore: IPageStore;
    private readonly robotsTxt: RobotsTxtService;
    private readonly logger = Logger.create('CrawlEngine');

    constructor(deps: {
        httpClient: HttpClient;
        htmlParser: HtmlParser;
        frontier: IUrlFrontier;
        pageStore: IPageStore;
        robotsTxt: RobotsTxtService;
    }) {
        this.httpClient = deps.httpClient;
        this.htmlParser = deps.htmlParser;
        this.frontier = deps.frontier;
        this.pageStore = deps.pageStore;
        this.robotsTxt = deps.robotsTxt;
    }

    // ── Public API ───────────────────────────────────────────

    /**
     * Starts a new crawl job asynchronously.
     * Returns the CrawlJob immediately (in "running" state).
     */
    public async startJob(config: CrawlConfig): Promise<CrawlJob> {
        const job = new CrawlJob(config);
        this.jobs.set(job.id, job);

        this.logger.info(
            `Starting crawl job ${job.id} — seed: ${config.seedUrl}, maxDepth: ${config.maxDepth}, maxPages: ${config.maxPages}`
        );

        // Start the crawl in the background (don't await)
        this.executeCrawl(job).catch((err) => {
            this.logger.error(
                `Job ${job.id} encountered a fatal error: ${err.message}`
            );
            if (job.isActive) {
                job.fail(err.message);
            }
        });

        return job;
    }

    /**
     * Retrieve a job by its ID.
     */
    public getJob(id: string): CrawlJob | undefined {
        return this.jobs.get(id);
    }

    /**
     * Retrieve all pages for a specific job.
     */
    public async getJobPages(jobId: string): Promise<PageResult[]> {
        return await this.pageStore.findByJobId(jobId);
    }

    /**
     * Cancel a running or pending job.
     */
    public cancelJob(id: string): boolean {
        const job = this.jobs.get(id);
        if (!job || !job.isActive) return false;
        job.cancel();
        this.logger.info(`Job ${id} cancelled`);
        return true;
    }

    /**
     * List all tracked jobs.
     */
    public listJobs(): CrawlJob[] {
        return Array.from(this.jobs.values());
    }

    // ── Core Crawl Loop ──────────────────────────────────────

    private async executeCrawl(job: CrawlJob): Promise<void> {
        const { config } = job;
        const depthMap = new Map<string, number>();
        const limit = pLimit(config.concurrency);

        // Reset frontier for this crawl
        await this.frontier.reset();

        // Seed the frontier
        const seedEntity = UrlEntity.from(config.seedUrl);
        if (!seedEntity) {
            job.start();
            job.fail('Invalid seed URL');
            return;
        }

        const seedDomain = seedEntity.domain;
        await this.frontier.add(seedEntity.normalized);
        depthMap.set(seedEntity.normalized, 0);

        job.start();

        while (!job.hasReachedLimit() && job.status === 'running') {
            const queueSize = await this.frontier.size();
            if (queueSize === 0) break;

            // Drain the current batch from the frontier
            const batch: string[] = [];
            const batchSize = Math.min(
                config.concurrency,
                config.maxPages - job.stats.totalProcessed
            );

            for (let i = 0; i < batchSize; i++) {
                const url = await this.frontier.next();
                if (!url) break;
                batch.push(url);
            }

            if (batch.length === 0) break;

            // Process batch concurrently with p-limit
            const tasks = batch.map((url) =>
                limit(async () => {
                    if (
                        job.hasReachedLimit() ||
                        job.status !== 'running'
                    ) {
                        return;
                    }
                    await this.processUrl(
                        url,
                        job,
                        depthMap,
                        seedDomain
                    );
                })
            );

            await Promise.all(tasks);
        }

        if (job.status === 'running') {
            job.complete();
            this.logger.info(
                `Job ${job.id} completed — ${job.stats.pagesVisited} pages crawled in ${job.stats.elapsedMs()}ms`
            );
        }
    }

    // ── Per-URL Processing ───────────────────────────────────

    private async processUrl(
        url: string,
        job: CrawlJob,
        depthMap: Map<string, number>,
        seedDomain: string
    ): Promise<void> {
        const depth = depthMap.get(url) ?? 0;

        try {
            // robots.txt check
            if (job.config.respectRobotsTxt) {
                const allowed =
                    await this.robotsTxt.isAllowed(url);
                if (!allowed) {
                    this.logger.debug(
                        `Blocked by robots.txt: ${url}`
                    );
                    return;
                }
            }

            // Fetch
            const response = await this.httpClient.fetch(url);

            // Only parse HTML content
            if (
                !response.contentType.includes('text/html') &&
                response.contentType !== ''
            ) {
                this.logger.debug(
                    `Skipping non-HTML: ${url} (${response.contentType})`
                );
                return;
            }

            // Parse
            const urlEntity = UrlEntity.from(url)!;
            const parsed = this.htmlParser.parse(url, response.html);

            // Build PageResult
            const page = new PageResult({
                url: urlEntity,
                title: parsed.title,
                description: parsed.description,
                headings: parsed.headings,
                links: parsed.links,
                statusCode: response.statusCode,
                depth,
                responseTimeMs: response.responseTimeMs,
                contentLength: response.contentLength,
                jobId: job.id
            });

            // Store the result
            job.addPage(page);
            await this.pageStore.save(page);

            // Enqueue discovered links (if within depth limit)
            if (depth < job.config.maxDepth) {
                await this.enqueueLinks(
                    parsed.links,
                    depth + 1,
                    depthMap,
                    seedDomain,
                    job.config.allowedDomains
                );
            }

            // Politeness delay
            if (job.config.delayMs > 0) {
                await this.sleep(job.config.delayMs);
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : String(err);
            this.logger.warn(
                `Error processing ${url}: ${message}`
            );
            job.recordError();
        }
    }

    private async enqueueLinks(
        links: UrlEntity[],
        nextDepth: number,
        depthMap: Map<string, number>,
        seedDomain: string,
        allowedDomains: string[]
    ): Promise<void> {
        for (const link of links) {
            // Domain filter: only crawl internal links or explicitly allowed domains
            const isAllowed =
                link.isInternal(seedDomain) ||
                allowedDomains.some((d) =>
                    link.isInternal(d)
                );

            if (!isAllowed) continue;

            const added = await this.frontier.add(link.normalized);
            if (added) {
                depthMap.set(link.normalized, nextDepth);
            }
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
