import http from 'http';
import { app } from './api/app.js';
import AppConfig from './config/index.js';
import { Logger } from './utils/Logger.js';

const logger = Logger.create('Server');

// ── Create HTTP Server ───────────────────────────────────────

const server = http.createServer(app);

// ── Start ────────────────────────────────────────────────────

server.listen(AppConfig.port, () => {
        logger.info(`🚀 Web Crawler API running on port ${AppConfig.port}`);
        logger.info(`   Environment : ${AppConfig.nodeEnv}`);
        logger.info(
                `   Health check: http://localhost:${AppConfig.port}/api/health`
        );
        logger.info(
                `   Crawl API   : http://localhost:${AppConfig.port}/api/crawl`
        );
});

// ── Graceful Shutdown ────────────────────────────────────────

const shutdown = (signal: string) => {
        logger.info(`${signal} received — shutting down gracefully…`);

        server.close(() => {
                logger.info('HTTP server closed');
                process.exit(0);
        });

        // Force exit after 10 seconds
        setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
        }, 10_000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
