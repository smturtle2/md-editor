import { describe, expect, it } from 'vitest';
import { buildOutlineFromMarkdown, editorJsonToMarkdown, getDocStats, markdownToHtml, normalizeMarkdown } from './markdown';

describe('markdown helpers', () => {
  it('normalizes newlines and guarantees a trailing newline', () => {
    expect(normalizeMarkdown('Hello\r\nWorld')).toBe('Hello\nWorld\n');
  });

  it('builds outline items from headings', () => {
    expect(buildOutlineFromMarkdown('# Title\n\n## Details')).toEqual([
      { depth: 1, text: 'Title', slug: 'title' },
      { depth: 2, text: 'Details', slug: 'details' },
    ]);
  });

  it('keeps unicode heading slugs stable', () => {
    expect(buildOutlineFromMarkdown('# 시작하기\n\n## 문서 개요')).toEqual([
      { depth: 1, text: '시작하기', slug: '시작하기' },
      { depth: 2, text: '문서 개요', slug: '문서-개요' },
    ]);
  });

  it('serializes editor json into markdown blocks', () => {
    const markdown = editorJsonToMarkdown({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'md-editor' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Rendered editing.' }],
        },
        {
          type: 'mermaidBlock',
          attrs: { code: 'flowchart LR\n  A --> B' },
        },
      ],
    });

    expect(markdown).toContain('# md-editor');
    expect(markdown).toContain('Rendered editing.');
    expect(markdown).toContain('```mermaid');
  });

  it('serializes code blocks with a fence language when present', () => {
    const markdown = editorJsonToMarkdown({
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: 'ts' },
          content: [{ type: 'text', text: 'const answer = 42;' }],
        },
      ],
    });

    expect(markdown).toContain('```ts');
    expect(markdown).toContain('const answer = 42;');
  });

  it('keeps code block fences bare when no language is set', () => {
    const markdown = editorJsonToMarkdown({
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: null },
          content: [{ type: 'text', text: 'plain text' }],
        },
      ],
    });

    expect(markdown).toContain('```\nplain text\n```');
    expect(markdown).not.toContain('```null');
  });

  it('renders fenced language classes for code blocks', () => {
    const html = markdownToHtml('```ts\nconst answer = 42;\n```');

    expect(html).toContain('language-ts');
  });

  it('computes document stats from markdown text', () => {
    const stats = getDocStats('# Title\n\nA short paragraph.');

    expect(stats.headings).toBe(1);
    expect(stats.words).toBeGreaterThan(2);
    expect(stats.readingMinutes).toBe(1);
  });

  it('serializes callout blocks using the first paragraph as the title', () => {
    const markdown = editorJsonToMarkdown({
      type: 'doc',
      content: [
        {
          type: 'calloutBlock',
          attrs: { tone: 'tip' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Tip' }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Keep the canvas quiet.' }],
            },
          ],
        },
      ],
    });

    expect(markdown).toContain('> [!TIP] Tip');
    expect(markdown).toContain('> Keep the canvas quiet.');
  });
});
