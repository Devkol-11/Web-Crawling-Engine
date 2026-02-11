import * as cheerio from 'cheerio';
import { UrlEntity } from '../models/UrlEntity.js';
import { Logger } from '../utils/Logger.js';

/**
 * Shape returned by HtmlParser.parse().
 */
export interface ParsedPage {
    title: string | null;
    description: string | null;
    headings: string[];
    links: UrlEntity[];
}

/**
 * HtmlParser — Cheerio-based HTML parser that extracts metadata
 * (title, description, headings) and discovers all links on a page,
 * resolving relative URLs against the page's base URL.
 */
export class HtmlParser {
    private readonly logger = Logger.create('HtmlParser');

    /**
     * Parses raw HTML and extracts structured data.
     * @param baseUrl - The URL of the page being parsed (for resolving relative links).
     * @param html    - Raw HTML string.
     */
    public parse(baseUrl: string, html: string): ParsedPage {
        const $ = cheerio.load(html);

        const title = this.extractTitle($);
        const description = this.extractDescription($);
        const headings = this.extractHeadings($);
        const links = this.extractLinks($, baseUrl);

        this.logger.debug(
            `Parsed ${baseUrl}: title="${title}", links=${links.length}`
        );

        return { title, description, headings, links };
    }

    // ── Private Extractors ───────────────────────────────────

    private extractTitle($: cheerio.CheerioAPI): string | null {
        const text = $('title').first().text().trim();
        return text || null;
    }

    private extractDescription($: cheerio.CheerioAPI): string | null {
        const content = $('meta[name="description"]')
            .first()
            .attr('content');
        return content?.trim() || null;
    }

    private extractHeadings($: cheerio.CheerioAPI): string[] {
        const headings: string[] = [];
        $('h1, h2, h3').each((_i, el) => {
            const text = $(el).text().trim();
            if (text) headings.push(text);
        });
        return headings;
    }

    private extractLinks(
        $: cheerio.CheerioAPI,
        baseUrl: string
    ): UrlEntity[] {
        const links: UrlEntity[] = [];
        const seen = new Set<string>();

        $('a[href]').each((_i, el) => {
            const href = $(el).attr('href');
            if (!href) return;

            const entity = UrlEntity.from(href, baseUrl);
            if (entity && !seen.has(entity.normalized)) {
                seen.add(entity.normalized);
                links.push(entity);
            }
        });

        return links;
    }
}
