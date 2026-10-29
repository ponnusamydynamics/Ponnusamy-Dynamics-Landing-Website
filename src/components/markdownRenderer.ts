import { marked } from 'marked';

// Configure marked for GitHub Flavored Markdown
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdown(markdownText: string): string {
  if (!markdownText || !markdownText.trim()) {
    return '<p class="text-muted" style="font-style: italic;">No documentation provided yet for this system.</p>';
  }

  try {
    const rawHtml = marked.parse(markdownText) as string;
    return rawHtml;
  } catch (err) {
    console.error('Markdown parse error:', err);
    return `<pre>${escapeHtml(markdownText)}</pre>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
