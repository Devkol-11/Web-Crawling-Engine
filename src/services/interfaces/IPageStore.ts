import { PageResult } from '../../models/PageResult.js';

/**
 * IPageStore — Interface for persisting crawled page results.
 * Implementations can be in-memory, MongoDB, or any other backing store.
 */
export interface IPageStore {
    /**
     * Save a crawled page result.
     */
    save(page: PageResult): Promise<void>;

    /**
     * Retrieve all pages belonging to a specific crawl job.
     */
    findByJobId(jobId: string): Promise<PageResult[]>;

    /**
     * Count total pages stored for a specific crawl job.
     */
    count(jobId: string): Promise<number>;
}
