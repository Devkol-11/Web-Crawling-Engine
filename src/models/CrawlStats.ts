/**
 * CrawlStats — Tracks real-time metrics for a crawl job:
 * pages visited, pages errored, timing data.
 */
export class CrawlStats {
    private _pagesVisited: number = 0;
    private _pagesErrored: number = 0;
    private _startTime: Date | null = null;
    private _endTime: Date | null = null;

    // ── Getters ──────────────────────────────────────────────

    public get pagesVisited(): number {
        return this._pagesVisited;
    }

    public get pagesErrored(): number {
        return this._pagesErrored;
    }

    public get totalProcessed(): number {
        return this._pagesVisited + this._pagesErrored;
    }

    public get startTime(): Date | null {
        return this._startTime;
    }

    public get endTime(): Date | null {
        return this._endTime;
    }

    // ── Mutations ────────────────────────────────────────────

    public start(): void {
        this._startTime = new Date();
    }

    public stop(): void {
        this._endTime = new Date();
    }

    public incrementVisited(): void {
        this._pagesVisited++;
    }

    public incrementErrored(): void {
        this._pagesErrored++;
    }

    // ── Derived Data ─────────────────────────────────────────

    /**
     * Returns elapsed time in milliseconds.
     * If not started, returns 0.
     * If still running, measures from start to now.
     */
    public elapsedMs(): number {
        if (!this._startTime) return 0;
        const end = this._endTime ?? new Date();
        return end.getTime() - this._startTime.getTime();
    }

    /**
     * Returns pages crawled per second.
     */
    public pagesPerSecond(): number {
        const elapsed = this.elapsedMs();
        if (elapsed === 0) return 0;
        return (this._pagesVisited / elapsed) * 1000;
    }

    // ── Serialization ────────────────────────────────────────

    public toJSON(): object {
        return {
            pagesVisited: this._pagesVisited,
            pagesErrored: this._pagesErrored,
            totalProcessed: this.totalProcessed,
            elapsedMs: this.elapsedMs(),
            pagesPerSecond:
                Math.round(this.pagesPerSecond() * 100) / 100,
            startTime: this._startTime?.toISOString() ?? null,
            endTime: this._endTime?.toISOString() ?? null
        };
    }
}
