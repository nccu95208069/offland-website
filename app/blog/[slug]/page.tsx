import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug, getPostContent } from '@/lib/notion';
import { renderBlocks } from '@/lib/notion-renderer';
import styles from './page.module.css';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    try {
        const posts = await getAllPosts();
        return posts.map((post) => ({ slug: post.slug }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug).catch(() => null);

    if (!post) {
        return { title: '找不到文章' };
    }

    const seoTitle = post.seoTitle || `${post.title}｜OFFLAND 旅誌`;
    const seoDescription = post.seoDescription || post.excerpt;

    return {
        title: seoTitle,
        description: seoDescription,
        keywords: post.tags,
        openGraph: {
            title: seoTitle,
            description: seoDescription,
            type: 'article',
            publishedTime: post.publishedAt,
            modifiedTime: post.updatedAt,
            authors: post.author ? [post.author] : undefined,
            tags: post.tags,
            images: post.coverImage ? [{ url: post.coverImage, width: 1200, height: 630 }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title: seoTitle,
            description: seoDescription,
            images: post.coverImage ? [post.coverImage] : undefined,
        },
    };
}

export const revalidate = 60;

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;

    let post;
    let contentHtml = '';

    try {
        post = await getPostBySlug(slug);
        if (!post) notFound();
        const blocks = await getPostContent(post.id);
        contentHtml = renderBlocks(blocks);
    } catch {
        notFound();
    }

    // JSON-LD Article Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage || undefined,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        author: {
            '@type': 'Person',
            name: post.author || 'OFFLAND',
        },
        publisher: {
            '@type': 'Organization',
            name: 'OFFLAND 遺忘無際',
            url: 'https://www.offland-yilan.com',
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://www.offland-yilan.com/blog/${post.slug}`,
        },
    };

    // Breadcrumb JSON-LD
    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首頁', item: 'https://www.offland-yilan.com' },
            { '@type': 'ListItem', position: 2, name: '旅誌', item: 'https://www.offland-yilan.com/blog' },
            { '@type': 'ListItem', position: 3, name: post.title },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />

            <main className={styles.main}>
                {/* Cover Image */}
                {post.coverImage && (
                    <div className={styles.coverWrapper}>
                        <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            priority
                            sizes="100vw"
                            className={styles.coverImage}
                        />
                        <div className={styles.coverOverlay} />
                    </div>
                )}

                <article className={styles.article}>
                    {/* Breadcrumb */}
                    <nav className={styles.breadcrumb} aria-label="breadcrumb">
                        <Link href="/">首頁</Link>
                        <span className={styles.breadcrumbSep}>/</span>
                        <Link href="/blog">旅誌</Link>
                        <span className={styles.breadcrumbSep}>/</span>
                        <span className={styles.breadcrumbCurrent}>{post.title}</span>
                    </nav>

                    {/* Header */}
                    <header className={styles.header}>
                        {post.tags.length > 0 && (
                            <div className={styles.tags}>
                                {post.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        )}
                        <h1>{post.title}</h1>
                        <div className={styles.meta}>
                            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                            {post.author && (
                                <>
                                    <span className={styles.metaDivider}>·</span>
                                    <span>{post.author}</span>
                                </>
                            )}
                        </div>
                    </header>

                    {/* Content */}
                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{ __html: contentHtml }}
                    />

                    {/* Footer */}
                    <footer className={styles.articleFooter}>
                        <div className={styles.backLink}>
                            <Link href="/blog">
                                ← 回到旅誌
                            </Link>
                        </div>
                    </footer>
                </article>
            </main>
        </>
    );
}
