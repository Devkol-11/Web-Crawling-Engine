import { IPageStore } from './interfaces/IPageStore.js';
import { PageResult } from '../models/PageResult.js';

/**
 * InMemoryPageStore — In-memory implementation of IPageStore.
 * Stores pages in a Map keyed by job ID.
 * Suitable for development and testing.
 */
export class InMemoryPageStore implements IPageStore {
    private readonly store = new Map<string, PageResult[]>();

    public async save(page: PageResult): Promise<void> {
        const pages = this.store.get(page.jobId) ?? [];
        pages.push(page);
        this.store.set(page.jobId, pages);
    }

    public async findByJobId(jobId: string): Promise<PageResult[]> {
        return this.store.get(jobId) ?? [];
    }

    public async count(jobId: string): Promise<number> {
        return (this.store.get(jobId) ?? []).length;
    }

    /**
     * Clear all stored pages.
     */
    public async clear(): Promise<void> {
        this.store.clear();
    }
}
