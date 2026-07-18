'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import type { BlogPost, CreatePostData } from '@/types/blog';

type ViewMode = 'list' | 'create' | 'edit';

const emptyForm: CreatePostData = {
    title: '',
    slug: '',
    excerpt: '',
    coverImage: '',
    author: 'OFFLAND',
    tags: [],
    published: false,
    seoTitle: '',
    seoDescription: '',
    content: '',
};

export default function AdminBlogPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CreatePostData>(emptyForm);
    const [tagsInput, setTagsInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

    // Fetch posts
    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/blog');
            if (res.status === 401) {
                router.push('/admin/login');
                return;
            }
            const data = await res.json();
            setPosts(Array.isArray(data) ? data : []);
        } catch {
            setError('無法取得文章列表。');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    // Filtered posts
    const filteredPosts = posts.filter((p) => {
        if (filter === 'published') return p.published;
        if (filter === 'draft') return !p.published;
        return true;
    });

    // Auto-generate slug from title
    const handleTitleChange = (title: string) => {
        setForm((prev) => ({
            ...prev,
            title,
            slug: prev.slug || title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, ''),
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        const payload = {
            ...form,
            tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        };

        try {
            let res;
            if (viewMode === 'edit' && editingId) {
                res = await fetch(`/api/blog/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch('/api/blog', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (res.status === 401) {
                router.push('/admin/login');
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '操作失敗');
            }

            setSuccess(viewMode === 'edit' ? '文章更新成功！' : '文章新增成功！');
            setViewMode('list');
            setForm(emptyForm);
            setTagsInput('');
            setEditingId(null);
            await fetchPosts();
        } catch (err: any) {
            setError(err.message || '操作失敗。');
        } finally {
            setSaving(false);
        }
    };

    // Edit post
    const startEdit = (post: BlogPost) => {
        setForm({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            coverImage: post.coverImage,
            author: post.author,
            tags: post.tags,
            published: post.published,
            seoTitle: post.seoTitle || '',
            seoDescription: post.seoDescription || '',
        });
        setTagsInput(post.tags.join(', '));
        setEditingId(post.id);
        setViewMode('edit');
        setError('');
        setSuccess('');
    };

    // Delete post
    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
            if (res.status === 401) {
                router.push('/admin/login');
                return;
            }
            if (!res.ok) throw new Error('刪除失敗');
            setSuccess('文章已刪除。');
            setDeleteConfirm(null);
            await fetchPosts();
        } catch {
            setError('刪除文章失敗。');
        }
    };

    // Logout
    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
    };

    // Format date
    const formatDate = (dateStr: string): string => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className={styles.wrapper}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>OFFLAND 旅誌管理</h1>
                </div>
                <div className={styles.headerRight}>
                    {viewMode === 'list' && (
                        <button
                            className={styles.primaryBtn}
                            onClick={() => {
                                setForm(emptyForm);
                                setTagsInput('');
                                setEditingId(null);
                                setViewMode('create');
                                setError('');
                                setSuccess('');
                            }}
                        >
                            ＋ 新增文章
                        </button>
                    )}
                    <a href="/admin/dashboard" style={{ color: 'var(--color-primary)', fontSize: 'var(--text-xs)' }}>
                        晨報
                    </a>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        登出
                    </button>
                </div>
            </header>

            {/* Notifications */}
            {error && <div className={styles.errorBar}>{error}</div>}
            {success && <div className={styles.successBar}>{success}</div>}

            {/* List View */}
            {viewMode === 'list' && (
                <div className={styles.content}>
                    {/* Filters */}
                    <div className={styles.filters}>
                        <button
                            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            全部 ({posts.length})
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filter === 'published' ? styles.active : ''}`}
                            onClick={() => setFilter('published')}
                        >
                            已發布 ({posts.filter((p) => p.published).length})
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filter === 'draft' ? styles.active : ''}`}
                            onClick={() => setFilter('draft')}
                        >
                            草稿 ({posts.filter((p) => !p.published).length})
                        </button>
                    </div>

                    {loading ? (
                        <div className={styles.loading}>載入中...</div>
                    ) : filteredPosts.length === 0 ? (
                        <div className={styles.empty}>
                            <p>尚無文章。</p>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>標題</th>
                                    <th>狀態</th>
                                    <th>作者</th>
                                    <th>日期</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPosts.map((post) => (
                                    <tr key={post.id}>
                                        <td className={styles.titleCell}>
                                            <span className={styles.postTitle}>{post.title}</span>
                                            <span className={styles.postSlug}>/{post.slug}</span>
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${post.published ? styles.published : styles.draft}`}>
                                                {post.published ? '已發布' : '草稿'}
                                            </span>
                                        </td>
                                        <td className={styles.authorCell}>{post.author || '—'}</td>
                                        <td className={styles.dateCell}>{formatDate(post.publishedAt)}</td>
                                        <td className={styles.actionsCell}>
                                            <button className={styles.actionBtn} onClick={() => startEdit(post)}>
                                                編輯
                                            </button>
                                            {deleteConfirm === post.id ? (
                                                <>
                                                    <button className={styles.dangerBtn} onClick={() => handleDelete(post.id)}>
                                                        確認刪除
                                                    </button>
                                                    <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>
                                                        取消
                                                    </button>
                                                </>
                                            ) : (
                                                <button className={styles.dangerBtn} onClick={() => setDeleteConfirm(post.id)}>
                                                    刪除
                                                </button>
                                            )}
                                            {post.published && post.slug && (
                                                <a
                                                    href={`/blog/${post.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.viewLink}
                                                >
                                                    查看
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Create / Edit Form */}
            {(viewMode === 'create' || viewMode === 'edit') && (
                <div className={styles.content}>
                    <div className={styles.formHeader}>
                        <h2>{viewMode === 'edit' ? '編輯文章' : '新增文章'}</h2>
                        <button
                            className={styles.backBtn}
                            onClick={() => {
                                setViewMode('list');
                                setForm(emptyForm);
                                setTagsInput('');
                                setEditingId(null);
                            }}
                        >
                            ← 返回列表
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGrid}>
                            {/* Main Column */}
                            <div className={styles.formMain}>
                                <div className={styles.field}>
                                    <label htmlFor="title">標題 *</label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        placeholder="文章標題"
                                        required
                                    />
                                </div>

                                <div className={styles.field}>
                                    <label htmlFor="slug">Slug *</label>
                                    <div className={styles.slugPreview}>
                                        <span>/blog/</span>
                                        <input
                                            id="slug"
                                            type="text"
                                            value={form.slug}
                                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                            placeholder="article-slug"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label htmlFor="excerpt">摘要</label>
                                    <textarea
                                        id="excerpt"
                                        value={form.excerpt}
                                        onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                                        placeholder="文章摘要（顯示在列表頁）"
                                        rows={3}
                                    />
                                </div>

                                {viewMode === 'create' && (
                                    <div className={styles.field}>
                                        <label htmlFor="content">內容（首段文字）</label>
                                        <textarea
                                            id="content"
                                            value={form.content || ''}
                                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                                            placeholder="文章初始內容（可在 Notion 中繼續編輯）"
                                            rows={8}
                                        />
                                    </div>
                                )}

                                {viewMode === 'edit' && (
                                    <div className={styles.notionHint}>
                                        💡 文章內容請直接在 Notion 中編輯。這裡只能修改文章屬性。
                                    </div>
                                )}
                            </div>

                            {/* Side Column */}
                            <div className={styles.formSide}>
                                <div className={styles.sideCard}>
                                    <h3>發布設定</h3>

                                    <div className={styles.field}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={form.published}
                                                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                                            />
                                            <span>發布文章</span>
                                        </label>
                                    </div>

                                    <div className={styles.field}>
                                        <label htmlFor="author">作者</label>
                                        <input
                                            id="author"
                                            type="text"
                                            value={form.author}
                                            onChange={(e) => setForm({ ...form, author: e.target.value })}
                                            placeholder="作者名稱"
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label htmlFor="coverImage">封面圖 URL</label>
                                        <input
                                            id="coverImage"
                                            type="url"
                                            value={form.coverImage}
                                            onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label htmlFor="tags">標籤（逗號分隔）</label>
                                        <input
                                            id="tags"
                                            type="text"
                                            value={tagsInput}
                                            onChange={(e) => setTagsInput(e.target.value)}
                                            placeholder="宜蘭, 旅行, 美食"
                                        />
                                    </div>
                                </div>

                                <div className={styles.sideCard}>
                                    <h3>SEO 設定</h3>

                                    <div className={styles.field}>
                                        <label htmlFor="seoTitle">SEO 標題</label>
                                        <input
                                            id="seoTitle"
                                            type="text"
                                            value={form.seoTitle || ''}
                                            onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                                            placeholder="留空則使用文章標題"
                                        />
                                    </div>

                                    <div className={styles.field}>
                                        <label htmlFor="seoDescription">SEO 描述</label>
                                        <textarea
                                            id="seoDescription"
                                            value={form.seoDescription || ''}
                                            onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                                            placeholder="留空則使用摘要"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={saving}
                                >
                                    {saving ? '儲存中...' : viewMode === 'edit' ? '更新文章' : '建立文章'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
