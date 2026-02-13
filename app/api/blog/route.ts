import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getAllPosts, createPost } from '@/lib/notion';
import type { CreatePostData } from '@/types/blog';

export async function GET() {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: '未授權。' }, { status: 401 });
    }

    try {
        const posts = await getAllPosts(true); // include unpublished
        return NextResponse.json(posts);
    } catch (error) {
        console.error('Failed to fetch posts:', error);
        return NextResponse.json({ error: '取得文章失敗。' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: '未授權。' }, { status: 401 });
    }

    try {
        const data: CreatePostData = await request.json();

        // Validate required fields
        if (!data.title || !data.slug) {
            return NextResponse.json({ error: '標題和 slug 為必填。' }, { status: 400 });
        }

        // Sanitize slug
        data.slug = data.slug
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        const post = await createPost(data);
        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error('Failed to create post:', error);
        return NextResponse.json({ error: '新增文章失敗。' }, { status: 500 });
    }
}
