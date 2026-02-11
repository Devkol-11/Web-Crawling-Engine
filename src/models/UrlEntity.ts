/**
 * UrlEntity — Value object that encapsulates URL normalization,
 * domain extraction, protocol validation, and internal-link checking.
 */
export class UrlEntity {
    public readonly raw: string;
    public readonly normalized: string;
    public readonly domain: string;
    public readonly protocol: string;
    public readonly pathname: string;

    private constructor(raw: string, parsed: URL) {
        this.raw = raw;
        this.protocol = parsed.protocol;
        this.domain = parsed.hostname;
        this.pathname = parsed.pathname;
        this.normalized = UrlEntity.normalize(parsed);
    }

    // ── Factory ──────────────────────────────────────────────

    /**
     * Creates a UrlEntity from a raw href, optionally resolving
     * against a base URL for relative links.
     * Returns `null` if the URL is invalid or non-HTTP(S).
     */
    public static from(
        href: string,
        baseUrl?: string
    ): UrlEntity | null {
        try {
            const trimmed = href.trim();
            if (!trimmed || trimmed.startsWith('#')) return null;
            if (
                trimmed.startsWith('mailto:') ||
                trimmed.startsWith('tel:') ||
                trimmed.startsWith('javascript:')
            ) {
                return null;
            }

            const parsed = baseUrl
                ? new URL(trimmed, baseUrl)
                : new URL(trimmed);

            if (
                parsed.protocol !== 'http:' &&
                parsed.protocol !== 'https:'
            ) {
                return null;
            }

            return new UrlEntity(href, parsed);
        } catch {
            return null;
        }
    }

    // ── Public Methods ───────────────────────────────────────

    /**
     * Returns true if this URL belongs to the same domain as `baseDomain`.
     */
    public isInternal(baseDomain: string): boolean {
        return (
            this.domain === baseDomain ||
            this.domain.endsWith(`.${baseDomain}`)
        );
    }

    /**
     * Equality check based on normalized form.
     */
    public equals(other: UrlEntity): boolean {
        return this.normalized === other.normalized;
    }

    public toString(): string {
        return this.normalized;
    }

    public toJSON(): object {
        return {
            raw: this.raw,
            normalized: this.normalized,
            domain: this.domain,
            protocol: this.protocol
        };
    }

    // ── Private Helpers ──────────────────────────────────────

    /**
     * Normalizes a URL: lowercase host, strip fragment,
     * strip trailing slash (unless root), strip default ports.
     */
    private static normalize(url: URL): string {
        url.hash = '';

        // Remove default ports
        if (
            (url.protocol === 'http:' && url.port === '80') ||
            (url.protocol === 'https:' && url.port === '443')
        ) {
            url.port = '';
        }

        let result = url.toString();

        // Strip trailing slash (but keep root "/")
        if (result.endsWith('/') && url.pathname !== '/') {
            result = result.slice(0, -1);
        }

        return result;
    }
}
