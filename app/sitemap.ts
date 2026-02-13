import { MetadataRoute } from 'next'

async function getBlogSlugs(): Promise<string[]> {
    try {
        // Dynamic import to avoid issues if Notion is not configured
        const { getAllPosts } = await import('@/lib/notion');
        const posts = await getAllPosts();
        return posts.map((p) => p.slug).filter(Boolean);
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.offland-yilan.com'

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/spaces`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/experience`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
    ]

    // Dynamic blog post pages
    const slugs = await getBlogSlugs();
    const blogPages: MetadataRoute.Sitemap = slugs.map((slug) => ({
        url: `${baseUrl}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }));

    return [...staticPages, ...blogPages];
}
