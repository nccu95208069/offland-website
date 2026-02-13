import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { updatePost, deletePost, getPostById } from '@/lib/notion';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: '未授權。' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const data = await request.json();

        // Sanitize slug if provided
        if (data.slug) {
            data.slug = data.slug
                .toLowerCase()
                .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        }

        const post = await updatePost(id, data);
        return NextResponse.json(post);
    } catch (error) {
        console.error('Failed to update post:', error);
        return NextResponse.json({ error: '更新文章失敗。' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: '未授權。' }, { status: 401 });
    }

    const { id } = await params;

    try {
        await deletePost(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete post:', error);
        return NextResponse.json({ error: '刪除文章失敗。' }, { status: 500 });
    }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: '未授權。' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const post = await getPostById(id);
        if (!post) {
            return NextResponse.json({ error: '文章不存在。' }, { status: 404 });
        }
        return NextResponse.json(post);
    } catch (error) {
        console.error('Failed to fetch post:', error);
        return NextResponse.json({ error: '取得文章失敗。' }, { status: 500 });
    }
}
