import MarkdownIt from 'markdown-it';
import markdownItContainer from 'markdown-it-container';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItTaskLists from 'markdown-it-task-lists';
import type { JSONContent } from '@tiptap/react';
import type { DocBlock, DocStats, OutlineItem } from '../types';

const CALL_OUT_RE = /^\s*>\s*\[!([A-Z]+)\]\s*(.*)$/;
const DEFAULT_CALLOUT_TITLE: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  warning: 'Warning',
  important: 'Important',
  caution: 'Caution',
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function preprocessCallouts(markdown: string) {
  const lines = markdown.split('\n');
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(CALL_OUT_RE);

    if (!match) {
      output.push(line);
      continue;
    }

    const tone = match[1].toLowerCase();
    const title = match[2].trim() || DEFAULT_CALLOUT_TITLE[tone] || tone;
    const body: string[] = [];

    index += 1;
    while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
      body.push(lines[index].replace(/^\s*>\s?/, ''));
      index += 1;
    }
    index -= 1;

    output.push(`\`\`\`callout-${tone} ${title}`);
    output.push(...body);
    output.push('```');
  }

  return output.join('\n');
}

function preprocessMathBlocks(markdown: string) {
  return markdown.replace(/\$\$\s*\n?([\s\S]*?)\n?\$\$/g, (_, formula: string) => {
    return `\`\`\`math\n${formula.trim()}\n\`\`\``;
  });
}

export function normalizeMarkdown(markdown: string) {
  return markdown.replaceAll('\r\n', '\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function createMarkdownEngine() {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
  });

  md.use(markdownItFootnote);
  md.use(markdownItTaskLists, { enabled: true, label: true });
  md.use(markdownItContainer, 'callout');

  const defaultFence =
    md.renderer.rules.fence?.bind(md.renderer.rules) ??
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = token.info.trim();
    const [kind, ...rest] = info.split(/\s+/);

    if (kind.startsWith('callout-')) {
      const tone = kind.replace('callout-', '') || 'note';
      const title = rest.join(' ') || DEFAULT_CALLOUT_TITLE[tone] || tone;
      const bodyHtml = md.render(token.content.trim());

      return `<section data-callout-block="true" data-tone="${escapeHtml(tone)}"><div data-callout-body="true"><p>${escapeHtml(title)}</p>${bodyHtml}</div></section>`;
    }

    if (kind === 'mermaid') {
      return `<figure data-mermaid-block="true"><pre>${escapeHtml(token.content.trim())}</pre></figure>`;
    }

    if (kind === 'math') {
      return `<figure data-math-block="true"><pre>${escapeHtml(token.content.trim())}</pre></figure>`;
    }

    return defaultFence(tokens, idx, options, env, self);
  };

  return md;
}

const md = createMarkdownEngine();

export function markdownToHtml(markdown: string) {
  const prepared = preprocessMathBlocks(preprocessCallouts(normalizeMarkdown(markdown)));
  return md.render(prepared);
}

function textFromNode(node: JSONContent | undefined): string {
  if (!node) {
    return '';
  }

  if (node.type === 'text') {
    return node.text ?? '';
  }

  return (node.content ?? []).map(textFromNode).join('');
}

function escapeMarkdownText(text: string) {
  return text.replace(/([\\`*_{}\[\]()#+!|>])/g, '\\$1');
}

function serializeText(node: JSONContent) {
  let value = escapeMarkdownText(node.text ?? '');
  const marks = node.marks ?? [];

  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':
        value = `**${value}**`;
        break;
      case 'italic':
        value = `*${value}*`;
        break;
      case 'strike':
        value = `~~${value}~~`;
        break;
      case 'code':
        value = `\`${node.text ?? ''}\``;
        break;
      case 'underline':
        value = `<u>${value}</u>`;
        break;
      case 'link':
        value = `[${value}](${mark.attrs?.href ?? '#'})`;
        break;
      default:
        break;
    }
  }

  return value;
}

function serializeInline(content: JSONContent[] | undefined): string {
  return (content ?? [])
    .map((node) => {
      if (node.type === 'text') {
        return serializeText(node);
      }
      if (node.type === 'hardBreak') {
        return '  \n';
      }
      return textFromNode(node);
    })
    .join('');
}

function serializeList(node: JSONContent, depth = 0, ordered = false, task = false): string {
  return (node.content ?? [])
    .map((item, index) => {
      const prefix = `${'  '.repeat(depth)}${task ? `- [${item.attrs?.checked ? 'x' : ' '}]` : ordered ? `${index + 1}.` : '-'} `;
      const firstBlock = item.content?.[0];
      const firstLine =
        firstBlock?.type === 'paragraph'
          ? `${prefix}${serializeInline(firstBlock.content)}`
          : `${prefix}${serializeNode(firstBlock, depth + 1).trimStart()}`;
      const remaining = (item.content ?? [])
        .slice(firstBlock?.type === 'paragraph' ? 1 : 0)
        .map((child) => serializeNode(child, depth + 1))
        .filter(Boolean)
        .map((chunk) => `${'  '.repeat(depth + 1)}${chunk.replace(/\n/g, `\n${'  '.repeat(depth + 1)}`)}`)
        .join('\n');

      return [firstLine, remaining].filter(Boolean).join('\n');
    })
    .join('\n');
}

function serializeTable(node: JSONContent) {
  const rows = (node.content ?? []).map((row) =>
    (row.content ?? []).map((cell) => serializeInline(cell.content).replace(/\|/g, '\\|').trim()),
  );

  if (!rows.length) {
    return '';
  }

  const header = rows[0];
  const separator = header.map(() => '---');
  const body = rows.slice(1);

  return [
    `| ${header.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    ...body.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

export function serializeNode(node: JSONContent | undefined, depth = 0): string {
  if (!node?.type) {
    return '';
  }

  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((child) => serializeNode(child, depth)).filter(Boolean).join('\n\n');
    case 'paragraph':
      return serializeInline(node.content);
    case 'heading':
      return `${'#'.repeat(node.attrs?.level ?? 1)} ${serializeInline(node.content)}`.trim();
    case 'bulletList':
      return serializeList(node, depth, false, false);
    case 'orderedList':
      return serializeList(node, depth, true, false);
    case 'taskList':
      return serializeList(node, depth, false, true);
    case 'blockquote':
      return (node.content ?? [])
        .map((child) => serializeNode(child, depth))
        .join('\n\n')
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    case 'codeBlock':
      return `\`\`\`${node.attrs?.language ?? ''}\n${textFromNode(node).replace(/\n$/, '')}\n\`\`\``;
    case 'horizontalRule':
      return '---';
    case 'table':
      return serializeTable(node);
    case 'calloutBlock': {
      const tone = String(node.attrs?.tone ?? 'note').toUpperCase();
      const blocks = (node.content ?? []).map((child) => serializeNode(child, depth)).filter(Boolean);
      const defaultTitle = DEFAULT_CALLOUT_TITLE[String(node.attrs?.tone ?? 'note')] ?? 'Note';
      const title = blocks[0]?.replace(/\n+/g, ' ').trim() || defaultTitle;
      const body = blocks.slice(1).join('\n\n').trim();

      if (!body) {
        return `> [!${tone}] ${title}`;
      }

      return [`> [!${tone}] ${title}`, ...body.split('\n').map((line) => `> ${line}`)].join('\n').trimEnd();
    }
    case 'mermaidBlock':
      return `\`\`\`mermaid\n${String(node.attrs?.code ?? '').trim()}\n\`\`\``;
    case 'mathBlock':
      return `$$\n${String(node.attrs?.formula ?? '').trim()}\n$$`;
    default:
      return serializeInline(node.content);
  }
}

export function editorJsonToMarkdown(doc: JSONContent) {
  return `${serializeNode(doc).trim()}\n`;
}

export function buildOutlineFromMarkdown(markdown: string): OutlineItem[] {
  return normalizeMarkdown(markdown)
    .split('\n')
    .map((line) => line.match(/^(#{1,6})\s+(.*)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => {
      const text = match[2].trim();
      return {
        depth: match[1].length,
        text,
        slug: slugify(text),
      };
    });
}

export function getDocStats(markdown: string): DocStats {
  const plainText = normalizeMarkdown(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/[#>*_\-\[\]()`|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = plainText ? plainText.split(' ').length : 0;

  return {
    words,
    characters: plainText.length,
    readingMinutes: Math.max(1, Math.ceil(words / 220)),
    headings: buildOutlineFromMarkdown(markdown).length,
  };
}

export function buildBlocksFromMarkdown(markdown: string): DocBlock[] {
  return normalizeMarkdown(markdown)
    .split('\n\n')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const firstLine = chunk.split('\n')[0];
      if (firstLine.startsWith('#')) {
        return { kind: 'heading', text: firstLine.replace(/^#+\s*/, '') };
      }
      if (firstLine.startsWith('```mermaid')) {
        return { kind: 'mermaid', text: chunk };
      }
      if (firstLine.startsWith('$$')) {
        return { kind: 'math', text: chunk };
      }
      if (firstLine.startsWith('> [!')) {
        return { kind: 'callout', text: chunk };
      }
      if (firstLine.startsWith('|')) {
        return { kind: 'table', text: chunk };
      }
      return { kind: 'paragraph', text: chunk };
    });
}
