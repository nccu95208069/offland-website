// Notion Block → HTML renderer

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function renderRichText(richTexts: any[]): string {
    if (!richTexts) return '';
    return richTexts
        .map((rt: any) => {
            let text = escapeHtml(rt.plain_text);
            if (rt.annotations.bold) text = `<strong>${text}</strong>`;
            if (rt.annotations.italic) text = `<em>${text}</em>`;
            if (rt.annotations.strikethrough) text = `<del>${text}</del>`;
            if (rt.annotations.underline) text = `<u>${text}</u>`;
            if (rt.annotations.code) text = `<code>${text}</code>`;
            if (rt.href) text = `<a href="${escapeHtml(rt.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            return text;
        })
        .join('');
}

function renderBlock(block: any): string {
    const type = block.type;
    const value = block[type];

    switch (type) {
        case 'paragraph':
            return `<p>${renderRichText(value.rich_text)}</p>`;

        case 'heading_1':
            return `<h2>${renderRichText(value.rich_text)}</h2>`;

        case 'heading_2':
            return `<h3>${renderRichText(value.rich_text)}</h3>`;

        case 'heading_3':
            return `<h4>${renderRichText(value.rich_text)}</h4>`;

        case 'bulleted_list_item':
            return `<li>${renderRichText(value.rich_text)}</li>`;

        case 'numbered_list_item':
            return `<li>${renderRichText(value.rich_text)}</li>`;

        case 'quote':
            return `<blockquote>${renderRichText(value.rich_text)}</blockquote>`;

        case 'code':
            return `<pre><code class="language-${value.language || 'text'}">${renderRichText(value.rich_text)}</code></pre>`;

        case 'divider':
            return '<hr />';

        case 'image': {
            const src =
                value.type === 'external' ? value.external.url : value.file?.url || '';
            const caption = value.caption ? renderRichText(value.caption) : '';
            return `<figure><img src="${escapeHtml(src)}" alt="${caption}" loading="lazy" />${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
        }

        case 'video': {
            const videoSrc =
                value.type === 'external' ? value.external.url : value.file?.url || '';
            return `<figure><video src="${escapeHtml(videoSrc)}" controls></video></figure>`;
        }

        case 'callout': {
            const icon = value.icon?.emoji || '💡';
            return `<div class="callout"><span class="callout-icon">${icon}</span><div>${renderRichText(value.rich_text)}</div></div>`;
        }

        case 'toggle': {
            const summary = renderRichText(value.rich_text);
            return `<details><summary>${summary}</summary></details>`;
        }

        case 'bookmark': {
            const url = value.url || '';
            const bookmarkCaption = value.caption ? renderRichText(value.caption) : url;
            return `<p><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${bookmarkCaption}</a></p>`;
        }

        default:
            return '';
    }
}

export function renderBlocks(blocks: any[]): string {
    const html: string[] = [];
    let inBulletedList = false;
    let inNumberedList = false;

    for (const block of blocks) {
        // Handle list grouping
        if (block.type === 'bulleted_list_item') {
            if (!inBulletedList) {
                html.push('<ul>');
                inBulletedList = true;
            }
        } else if (inBulletedList) {
            html.push('</ul>');
            inBulletedList = false;
        }

        if (block.type === 'numbered_list_item') {
            if (!inNumberedList) {
                html.push('<ol>');
                inNumberedList = true;
            }
        } else if (inNumberedList) {
            html.push('</ol>');
            inNumberedList = false;
        }

        const rendered = renderBlock(block);
        if (rendered) html.push(rendered);
    }

    // Close any open lists
    if (inBulletedList) html.push('</ul>');
    if (inNumberedList) html.push('</ol>');

    return html.join('\n');
}
