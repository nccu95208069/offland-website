export interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string;
    author: string;
    publishedAt: string;
    updatedAt: string;
    tags: string[];
    published: boolean;
    seoTitle?: string;
    seoDescription?: string;
}

export interface BlogPostWithContent extends BlogPost {
    content: string;
}

export interface CreatePostData {
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string;
    author: string;
    tags: string[];
    published: boolean;
    seoTitle?: string;
    seoDescription?: string;
    content?: string;
}

export interface UpdatePostData extends Partial<CreatePostData> {
    id: string;
}
