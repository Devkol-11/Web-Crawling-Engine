import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Logger } from '../utils/Logger.js';

/**
 * Shape of the data returned by HttpClient.fetch().
 */
export interface HttpResponse {
    url: string;
    html: string;
    statusCode: number;
    contentType: string;
    contentLength: number;
    responseTimeMs: number;
}

/**
 * HttpClient — Axios wrapper providing configurable timeouts,
 * user-agent headers, retry logic with exponential backoff,
 * and response validation.
 */
export class HttpClient {
    private readonly client: AxiosInstance;
    private readonly maxRetries: number;
    private readonly logger = Logger.create('HttpClient');

    constructor(params?: {
        timeoutMs?: number;
        userAgent?: string;
        maxRetries?: number;
    }) {
        this.maxRetries = params?.maxRetries ?? 3;

        const config: AxiosRequestConfig = {
            timeout: params?.timeoutMs ?? 10_000,
            headers: {
                Accept: 'text/html,application/xhtml+xml',
                'User-Agent':
                    params?.userAgent ??
                    'WebCrawlerBot/1.0'
            },
            // Accept all HTTP status codes — we handle them ourselves
            validateStatus: () => true,
            // Force response as text to avoid Axios auto-parsing JSON
            responseType: 'text'
        };

        this.client = axios.create(config);
    }

    // ── Public API ───────────────────────────────────────────

    /**
     * Fetches the given URL with retry logic.
     * Throws on exhausted retries or non-recoverable errors.
     */
    public async fetch(url: string): Promise<HttpResponse> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const start = Date.now();
                const response = await this.client.get(url);
                const elapsed = Date.now() - start;

                const httpResponse: HttpResponse = {
                    url,
                    html:
                        typeof response.data ===
                            'string'
                            ? response.data
                            : String(response.data),
                    statusCode: response.status,
                    contentType:
                        (response.headers[
                            'content-type'
                        ] as string) ?? '',
                    contentLength: Number(
                        response.headers[
                        'content-length'
                        ] ?? 0
                    ),
                    responseTimeMs: elapsed
                };

                this.logger.debug(
                    `Fetched ${url} → ${httpResponse.statusCode} in ${elapsed}ms`
                );

                return httpResponse;
            } catch (err: unknown) {
                lastError =
                    err instanceof Error
                        ? err
                        : new Error(String(err));

                // Don't retry non-recoverable errors
                if (this.isNonRecoverable(lastError)) {
                    break;
                }

                if (attempt < this.maxRetries) {
                    const backoff =
                        Math.pow(2, attempt) * 100;
                    this.logger.warn(
                        `Retry ${attempt}/${this.maxRetries} for ${url} in ${backoff}ms — ${lastError.message}`
                    );
                    await this.sleep(backoff);
                }
            }
        }

        this.logger.error(
            `Failed to fetch ${url} after ${this.maxRetries} attempts: ${lastError?.message}`
        );
        throw lastError;
    }

    // ── Private Helpers ──────────────────────────────────────

    private isNonRecoverable(err: Error): boolean {
        const msg = err.message.toLowerCase();
        return (
            msg.includes('invalid url') ||
            msg.includes('unsupported protocol')
        );
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
