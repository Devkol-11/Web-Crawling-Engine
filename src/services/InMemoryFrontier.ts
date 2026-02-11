import { IUrlFrontier } from './interfaces/IUrlFrontier.js';

/**
 * InMemoryFrontier — In-memory implementation of the URL frontier.
 * Uses an array as a FIFO queue and a Set for O(1) visited checks.
 * Suitable for development and small-scale crawls.
 */
export class InMemoryFrontier implements IUrlFrontier {
    private readonly queue: string[] = [];
    private readonly visited: Set<string> = new Set();

    public async add(url: string): Promise<boolean> {
        if (this.visited.has(url)) {
            return false;
        }
        this.visited.add(url);
        this.queue.push(url);
        return true;
    }

    public async next(): Promise<string | null> {
        return this.queue.shift() ?? null;
    }

    public async size(): Promise<number> {
        return this.queue.length;
    }

    public async hasVisited(url: string): Promise<boolean> {
        return this.visited.has(url);
    }

    public async reset(): Promise<void> {
        this.queue.length = 0;
        this.visited.clear();
    }

    /**
     * Total unique URLs seen (visited set size).
     */
    public get totalSeen(): number {
        return this.visited.size;
    }
}
