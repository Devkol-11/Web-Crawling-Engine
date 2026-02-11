import { Router, Request, Response } from 'express';
import { CrawlEngine } from '../services/CrawlEngine.js';
import { CrawlConfig } from '../models/CrawlConfig.js';
import { Logger } from '../utils/Logger.js';

/**
 * Creates the /api/crawl router.
 * All routes delegate to the injected CrawlEngine instance.
 */
export function createCrawlRouter(engine: CrawlEngine): Router {
    const router = Router();
    const logger = Logger.create('CrawlRoutes');

    // ── POST /api/crawl — Start a new crawl job ─────────────

    router.post('/', async (req: Request, res: Response) => {
        try {
            const {
                url,
                maxDepth,
                maxPages,
                concurrency,
                delayMs,
                respectRobotsTxt,
                allowedDomains
            } = req.body;

            if (!url) {
                res.status(400).json({
                    error: 'Missing required field: "url"'
                });
                return;
            }

            const config = new CrawlConfig({
                seedUrl: url,
                maxDepth,
                maxPages,
                concurrency,
                delayMs,
                respectRobotsTxt,
                allowedDomains
            });

            const job = await engine.startJob(config);

            logger.info(`Crawl job started: ${job.id}`);

            res.status(201).json({
                message: 'Crawl job started',
                job: job.toJSON()
            });
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Internal server error';
            logger.error(`Failed to start crawl: ${message}`);
            res.status(400).json({ error: message });
        }
    });

    // ── GET /api/crawl/:id — Get job status ─────────────────

    router.get('/:id', (req: Request, res: Response) => {
        const job = engine.getJob(req.params.id);
        if (!job) {
            res.status(404).json({
                error: `Job "${req.params.id}" not found`
            });
            return;
        }
        res.status(200).json(job.toJSON());
    });

    // ── GET /api/crawl/:id/pages — Get all crawled pages ────

    router.get(
        '/:id/pages',
        async (req: Request, res: Response) => {
            const job = engine.getJob(req.params.id);
            if (!job) {
                res.status(404).json({
                    error: `Job "${req.params.id}" not found`
                });
                return;
            }

            const pages = await engine.getJobPages(job.id);
            res.status(200).json({
                jobId: job.id,
                count: pages.length,
                pages: pages.map((p) => p.toJSON())
            });
        }
    );

    // ── DELETE /api/crawl/:id — Cancel a running job ────────

    router.delete('/:id', (req: Request, res: Response) => {
        const cancelled = engine.cancelJob(req.params.id);
        if (!cancelled) {
            res.status(404).json({
                error: `Job "${req.params.id}" not found or not active`
            });
            return;
        }
        res.status(200).json({
            message: `Job "${req.params.id}" cancelled`
        });
    });

    // ── GET /api/crawl — List all jobs ──────────────────────

    router.get('/', (_req: Request, res: Response) => {
        const jobs = engine.listJobs().map((j) => j.toJSON());
        res.status(200).json({ count: jobs.length, jobs });
    });

    return router;
}
