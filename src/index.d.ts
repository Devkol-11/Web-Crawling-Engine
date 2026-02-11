declare namespace global {
        namespace NodeJS {
                interface ProcessEnv {
                        NODE_ENV: 'development' | 'production' | 'test';
                        PORT: number;
                        MONGO_URI: string;
                        REDIS_URL: string;
                        LOG_LEVEL: string;
                }
        }
}

declare module 'robots-parser' {
        interface Robot {
                isAllowed(url: string, userAgent?: string): boolean | undefined;
                isDisallowed(
                        url: string,
                        userAgent?: string
                ): boolean | undefined;
                getCrawlDelay(userAgent?: string): number | undefined;
                getSitemaps(): string[];
        }

        function robotsParser(url: string, contents: string): Robot;
        export = robotsParser;
}
