import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/notion';
import styles from './page.module.css';

export const metadata: Metadata = {
    title: '旅誌｜OFFLAND 遺忘無際・宜蘭生活與旅行札記',
    description: '來自宜蘭五結的旅行札記。分享在地生活、民宿日常、周邊景點與慢遊心得。如果你正在找宜蘭包棟民宿的靈感，這裡或許有你想看的故事。',
    keywords: ['宜蘭旅遊', '宜蘭包棟民宿推薦', '五結景點', '宜蘭慢旅行', '宜蘭民宿部落格'],
    openGraph: {
        title: '旅誌｜OFFLAND 遺忘無際',
        description: '來自宜蘭五結的旅行札記，分享在地生活、民宿日常與慢遊心得。',
        type: 'website',
    },
};

export const revalidate = 60;

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function BlogPage() {
    let posts: Awaited<ReturnType<typeof getAllPosts>> = [];
    try {
        posts = await getAllPosts();
    } catch {
        posts = [];
    }

    return (
        <main className={styles.main}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    <span className={styles.heroLabel}>OFFLAND JOURNAL</span>
                    <h1>旅誌</h1>
                    <p>在田野與河畔之間，紀錄那些值得慢慢說的故事</p>
                </div>
            </section>

            {/* Posts Grid */}
            <section className={styles.postsSection}>
                <div className={styles.container}>
                    {posts.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                            </div>
                            <h2>故事正在醞釀中</h2>
                            <p>我們正在準備第一篇旅誌，敬請期待。</p>
                        </div>
                    ) : (
                        <div className={styles.postsGrid}>
                            {posts.map((post, index) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className={`${styles.postCard} ${index === 0 ? styles.featured : ''}`}
                                >
                                    <div className={styles.postImageWrapper}>
                                        {post.coverImage ? (
                                            <Image
                                                src={post.coverImage}
                                                alt={post.title}
                                                fill
                                                sizes={index === 0 ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
                                                className={styles.postImage}
                                            />
                                        ) : (
                                            <div className={styles.postImagePlaceholder}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.postContent}>
                                        {post.tags.length > 0 && (
                                            <div className={styles.postTags}>
                                                {post.tags.slice(0, 2).map((tag) => (
                                                    <span key={tag} className={styles.tag}>{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                        <h2 className={styles.postTitle}>{post.title}</h2>
                                        <p className={styles.postExcerpt}>{post.excerpt}</p>
                                        <div className={styles.postMeta}>
                                            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                                            {post.author && <span className={styles.authorDivider}>·</span>}
                                            {post.author && <span>{post.author}</span>}
                                        </div>
                                        <span className={styles.readMore}>閱讀更多 →</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
