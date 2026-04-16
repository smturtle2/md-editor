export type SaveState = 'loading' | 'ready' | 'dirty' | 'saving' | 'saved' | 'error';

export interface StoredDocument {
  id: 'active-document';
  title: string;
  markdown: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutlineItem {
  depth: number;
  text: string;
  slug: string;
}

export interface DocStats {
  words: number;
  characters: number;
  readingMinutes: number;
  headings: number;
}

export interface DocBlock {
  kind: string;
  text: string;
}

export interface DocSnapshot {
  source: string;
  blocks: DocBlock[];
  outline: OutlineItem[];
  stats: DocStats;
}
