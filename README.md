# web-crawl-service

**One-line:** Monolithic web crawler service in Node.js + TypeScript using Redis for URL frontier and MongoDB for persistent page storage.

## Goals

- Crawl pages from a seed URL and extract title, description, and internal links.
- Use **Redis** for fast ephemeral URL queue + visited set.
- Use **MongoDB (Mongoose)** for durable page storage.
- Expose an Express route `POST /crawl` to start a crawl job.
- Provide benchmarking via `autocannon`.

## Quick start

1. Copy `.env.example` → `.env` and set `MONGO_URI`, `REDIS_URL`, `PORT`.
2. Install deps: `npm install`
3. Dev run: `npx ts-node-dev --respawn src/index.ts`
4. Trigger crawl: `curl -X POST http://localhost:3000/crawl -H "Content-Type: application/json" -d '{"url":"https://example.com"}'`

## Stack

- Node.js, Express.js, TypeScript
- Axios, Cheerio
- Redis (queue + visited set)
- MongoDB (Mongoose)
- Autocannon for benchmarking

"src/\*_/_.ts"
