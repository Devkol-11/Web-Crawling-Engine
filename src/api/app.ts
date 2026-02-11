import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { CrawlEngine } from '../crawler/CrawlEngine.js';
import { HttpClient } from '../crawler/HttpClient.js';
import { HtmlParser } from '../crawler/HtmlParser.js';
import { InMemoryFrontier } from '../frontier/InMemoryFrontier.js';
import { InMemoryPageStore } from '../storage/InMemoryPageStore.js';
import { RobotsTxtService } from '../crawler/RobotsTxtService.js';
import { createCrawlRouter } from './routes/crawl.routes.js';
import { Logger } from '../utils/Logger.js';

const logger = Logger.create('App');

// ── Service Wiring ───────────────────────────────────────────

const httpClient = new HttpClient();
const htmlParser = new HtmlParser();
const frontier = new InMemoryFrontier();
const pageStore = new InMemoryPageStore();
const robotsTxt = new RobotsTxtService(httpClient, 'WebCrawlerBot/1.0');

const crawlEngine = new CrawlEngine({
    httpClient,
    htmlParser,
    frontier,
    pageStore,
    robotsTxt
});

// ── Express Application ──────────────────────────────────────

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('short'));

// ── Routes ───────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'up',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/crawl', createCrawlRouter(crawlEngine));

// ── Global Error Handler ─────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(500).json({
        error: 'Internal server error',
        message:
            process.env.NODE_ENV === 'development'
                ? err.message
                : undefined
    });
});

// ── 404 Handler ──────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
});

export { app, crawlEngine };
