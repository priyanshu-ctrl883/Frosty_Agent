import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/dashboard/', '/api/', '/ops/'],
            },
            {
                // Explicitly invite and allow AI & LLM crawlers for AEO boosting
                userAgent: [
                    'GPTBot',
                    'ChatGPT-User',
                    'PerplexityBot',
                    'Anthropic-ai',
                    'Claude-Web',
                    'ClaudeBot',
                    'Google-Extended',
                    'OAI-SearchBot',
                    'cohere-ai',
                    'CCBot',
                    'Bravebot',
                    'Applebot-Extended'
                ],
                allow: '/',
                disallow: ['/dashboard/', '/api/', '/ops/'],
            }
        ],
        sitemap: 'https://frostyagent.com/sitemap.xml',
    };
}
