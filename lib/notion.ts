import { Client } from '@notionhq/client';
import type { BlogPost, CreatePostData } from '@/types/blog';

const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_BLOG_DATABASE_ID || '';

// Helper to extract plain text from Notion rich text
function getPlainText(richText: any[]): string {
    return richText?.map((t: any) => t.plain_text).join('') || '';
}

// Helper to extract URL property
function getUrl(prop: any): string {
    return prop?.url || '';
}

// Helper to extract date
function getDate(prop: any): string {
    return prop?.date?.start || '';
}

// Helper to extract checkbox
function getCheckbox(prop: any): boolean {
    return prop?.checkbox || false;
}

// Helper to extract multi-select tags
function getMultiSelect(prop: any): string[] {
    return prop?.multi_select?.map((s: any) => s.name) || [];
}

// Transform Notion page to BlogPost
function pageToPost(page: any): BlogPost {
    const props = page.properties;
    return {
        id: page.id,
        slug: getPlainText(props['Slug']?.rich_text),
        title: getPlainText(props['Title']?.title),
        excerpt: getPlainText(props['Excerpt']?.rich_text),
        coverImage: getUrl(props['Cover Image']),
        author: getPlainText(props['Author']?.rich_text),
        publishedAt: getDate(props['Published At']),
        updatedAt: page.last_edited_time,
        tags: getMultiSelect(props['Tags']),
        published: getCheckbox(props['Published']),
        seoTitle: getPlainText(props['SEO Title']?.rich_text) || undefined,
        seoDescription: getPlainText(props['SEO Description']?.rich_text) || undefined,
    };
}

export async function getAllPosts(includeUnpublished = false): Promise<BlogPost[]> {
    const filter: any = includeUnpublished
        ? undefined
        : {
            property: 'Published',
            checkbox: { equals: true },
        };

    // Notion SDK v5 uses dataSources.query instead of databases.query
    const response = await (notion as any).dataSources.query({
        data_source_id: databaseId,
        filter,
        sorts: [{ property: 'Published At', direction: 'descending' }],
    });

    return response.results.map(pageToPost);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const response = await (notion as any).dataSources.query({
        data_source_id: databaseId,
        filter: {
            and: [
                { property: 'Slug', rich_text: { equals: slug } },
                { property: 'Published', checkbox: { equals: true } },
            ],
        },
    });

    if (response.results.length === 0) return null;
    return pageToPost(response.results[0]);
}

export async function getPostById(pageId: string): Promise<BlogPost | null> {
    try {
        const page = await notion.pages.retrieve({ page_id: pageId });
        return pageToPost(page);
    } catch {
        return null;
    }
}

export async function getPostContent(pageId: string): Promise<any[]> {
    const blocks: any[] = [];
    let cursor: string | undefined;

    do {
        const response = await notion.blocks.children.list({
            block_id: pageId,
            start_cursor: cursor,
            page_size: 100,
        });
        blocks.push(...response.results);
        cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (cursor);

    return blocks;
}

export async function createPost(data: CreatePostData): Promise<BlogPost> {
    const page = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
            'Title': { title: [{ text: { content: data.title } }] },
            'Slug': { rich_text: [{ text: { content: data.slug } }] },
            'Excerpt': { rich_text: [{ text: { content: data.excerpt } }] },
            'Cover Image': { url: data.coverImage || null },
            'Author': { rich_text: [{ text: { content: data.author } }] },
            'Published': { checkbox: data.published },
            'Published At': data.published ? { date: { start: new Date().toISOString().split('T')[0] } } : { date: null },
            'Tags': { multi_select: data.tags.map((tag) => ({ name: tag })) },
            ...(data.seoTitle && { 'SEO Title': { rich_text: [{ text: { content: data.seoTitle } }] } }),
            ...(data.seoDescription && { 'SEO Description': { rich_text: [{ text: { content: data.seoDescription } }] } }),
        } as any,
        // Add initial content if provided
        ...(data.content && {
            children: [
                {
                    object: 'block' as const,
                    type: 'paragraph' as const,
                    paragraph: {
                        rich_text: [{ type: 'text' as const, text: { content: data.content } }],
                    },
                },
            ],
        }),
    });

    return pageToPost(page);
}

export async function updatePost(pageId: string, data: Partial<CreatePostData>): Promise<BlogPost> {
    const properties: any = {};

    if (data.title !== undefined) {
        properties['Title'] = { title: [{ text: { content: data.title } }] };
    }
    if (data.slug !== undefined) {
        properties['Slug'] = { rich_text: [{ text: { content: data.slug } }] };
    }
    if (data.excerpt !== undefined) {
        properties['Excerpt'] = { rich_text: [{ text: { content: data.excerpt } }] };
    }
    if (data.coverImage !== undefined) {
        properties['Cover Image'] = { url: data.coverImage || null };
    }
    if (data.author !== undefined) {
        properties['Author'] = { rich_text: [{ text: { content: data.author } }] };
    }
    if (data.published !== undefined) {
        properties['Published'] = { checkbox: data.published };
        if (data.published) {
            properties['Published At'] = { date: { start: new Date().toISOString().split('T')[0] } };
        }
    }
    if (data.tags !== undefined) {
        properties['Tags'] = { multi_select: data.tags.map((tag) => ({ name: tag })) };
    }
    if (data.seoTitle !== undefined) {
        properties['SEO Title'] = { rich_text: [{ text: { content: data.seoTitle } }] };
    }
    if (data.seoDescription !== undefined) {
        properties['SEO Description'] = { rich_text: [{ text: { content: data.seoDescription } }] };
    }

    const page = await notion.pages.update({
        page_id: pageId,
        properties,
    });

    return pageToPost(page);
}

export async function deletePost(pageId: string): Promise<void> {
    await notion.pages.update({
        page_id: pageId,
        archived: true,
    });
}
