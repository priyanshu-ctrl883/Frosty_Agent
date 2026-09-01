import { MetadataRoute } from 'next';
import { getIndustries } from '@/lib/industries';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://frostyagent.com';
    const lastModified = new Date();

    const staticRoutes = [
        '',
        '/about',
        '/faq',
        '/pricing',
        '/terms',
        '/privacy',
        '/acceptable-use',
        '/status',
        '/contact',
        '/experience',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1.0 : 0.8,
    }));

    const industries = getIndustries();
    const industryRoutes = industries
        .filter(ind => ind.canonical_url)
        .map(ind => ({
            url: ind.canonical_url!,
            lastModified: ind.updated_date ? new Date(ind.updated_date) : lastModified,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));

    return [...staticRoutes, ...industryRoutes];
}
