/**
 * IUrlFrontier — Interface for URL queue + visited-set management.
 * Implementations can be in-memory or Redis-backed.
 */
export interface IUrlFrontier {
    /**
     * Add a URL to the queue if it hasn't been visited.
     * Returns true if the URL was added, false if already visited.
     */
    add(url: string): Promise<boolean>;

    /**
     * Pop the next URL from the queue (FIFO order).
     * Returns null if the queue is empty.
     */
    next(): Promise<string | null>;

    /**
     * Returns the number of URLs remaining in the queue.
     */
    size(): Promise<number>;

    /**
     * Check whether the given URL has already been visited / enqueued.
     */
    hasVisited(url: string): Promise<boolean>;

    /**
     * Clear all queued URLs and visited records.
     */
    reset(): Promise<void>;
}
