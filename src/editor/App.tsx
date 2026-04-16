import type { Editor } from '@tiptap/react';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppBar } from './components/AppBar';
import { EditorSurface } from './components/EditorSurface';
import { EditorToolbar } from './components/EditorToolbar';
import { getMessage, getWelcomeMarkdown, useI18n, type Locale } from './i18n';
import { parseMarkdown, normalizeImport, serializeMarkdown } from './lib/wasm';
import { loadDocument, saveDocument } from './lib/storage';
import { type DocStats, type OutlineItem, type SaveState, type StoredDocument } from './types';

const DEFAULT_STATS: DocStats = {
  words: 0,
  characters: 0,
  readingMinutes: 1,
  headings: 0,
};

function createInitialDocument(locale: Locale, markdown = getWelcomeMarkdown(locale)): StoredDocument {
  const now = new Date().toISOString();
  return {
    id: 'active-document',
    title: getMessage(locale, 'document.untitled'),
    markdown,
    createdAt: now,
    updatedAt: now,
  };
}

export default function App() {
  const { locale, t } = useI18n();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [documentState, setDocumentState] = useState<StoredDocument | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [stats, setStats] = useState<DocStats>(DEFAULT_STATS);
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [editorSeed, setEditorSeed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const documentRef = useRef<StoredDocument | null>(null);

  useEffect(() => {
    documentRef.current = documentState;
  }, [documentState]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const storedDocument = await loadDocument();
      if (cancelled) {
        return;
      }

      const nextDocument = storedDocument ?? createInitialDocument(locale);
      setDocumentState(nextDocument);
      setEditorSeed((value) => value + 1);
      setSaveState('saved');
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (!documentState) {
      return;
    }

    let cancelled = false;
    void parseMarkdown(documentState.markdown).then((snapshot) => {
      if (!cancelled) {
        setOutline(snapshot.outline);
        setStats(snapshot.stats);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [documentState?.markdown]);

  const flushSave = useCallback(async () => {
    const currentDocument = documentRef.current;
    if (!currentDocument) {
      return;
    }

    try {
      setSaveState('saving');
      await saveDocument(currentDocument);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, []);

  useEffect(() => {
    if (saveState !== 'dirty') {
      return;
    }

    const timer = window.setTimeout(() => {
      void flushSave();
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [flushSave, saveState]);

  useEffect(() => {
    function handleBlur() {
      if (saveState === 'dirty') {
        void flushSave();
      }
    }

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [flushSave, saveState]);

  const shellClassName = clsx('app-shell', isInfoOpen && 'app-shell--info-open');

  const handleMarkdownChange = useCallback((markdown: string) => {
    setDocumentState((current) => {
      if (!current || current.markdown === markdown) {
        return current;
      }

      return {
        ...current,
        markdown,
        updatedAt: new Date().toISOString(),
      };
    });
    setSaveState((current) => (current === 'loading' ? current : 'dirty'));
  }, []);

  const handleTitleChange = useCallback((title: string) => {
    setDocumentState((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        title,
        updatedAt: new Date().toISOString(),
      };
    });
    setSaveState((current) => (current === 'loading' ? current : 'dirty'));
  }, []);

  const handleExport = useCallback(async () => {
    if (!documentState) {
      return;
    }

    const snapshot = await parseMarkdown(documentState.markdown);
    const markdown = await serializeMarkdown(snapshot);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const downloadBase = (documentState.title.trim() || t('document.untitled')).replace(/\s+/g, '-').toLowerCase();
    anchor.href = url;
    anchor.download = `${downloadBase}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [documentState, t]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportedFile = useCallback(async (file: File) => {
    const source = await file.text();
    const snapshot = await normalizeImport(source);
    const now = new Date().toISOString();
    setDocumentState({
      id: 'active-document',
      title: file.name.replace(/\.md$/i, '') || t('document.imported'),
      markdown: snapshot.source,
      createdAt: now,
      updatedAt: now,
    });
    setEditorSeed((value) => value + 1);
    setSaveState('dirty');
  }, [t]);

  const infoTitle = useMemo(() => {
    if (!documentState?.updatedAt) {
      return t('info.noEdits');
    }

    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(documentState.updatedAt));
  }, [documentState?.updatedAt, locale, t]);

  if (!documentState) {
    return <main className="loading-screen">{t('app.loadingScreen')}</main>;
  }

  return (
    <main className={shellClassName}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,text/markdown"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImportedFile(file);
          }
          event.currentTarget.value = '';
        }}
      />

      <AppBar
        title={documentState.title}
        saveState={saveState}
        editor={editor}
        infoOpen={isInfoOpen}
        onTitleChange={handleTitleChange}
        onImport={handleImport}
        onExport={handleExport}
        onToggleInfo={() => setIsInfoOpen((current) => !current)}
      />

      <EditorToolbar editor={editor} />

      <aside className={clsx('info-panel', isInfoOpen && 'is-open')}>
        <div className="info-panel__section">
          <span className="info-panel__label">{t('info.updated')}</span>
          <strong>{infoTitle}</strong>
        </div>
        <div className="info-panel__section">
          <span className="info-panel__label">{t('info.document')}</span>
          <div className="info-panel__stats">
            <span>{t('info.words', { count: stats.words })}</span>
            <span>{t('info.characters', { count: stats.characters })}</span>
            <span>{t('info.readingMinutes', { count: stats.readingMinutes })}</span>
            <span>{t('info.headings', { count: stats.headings })}</span>
          </div>
        </div>
        <div className="info-panel__section">
          <span className="info-panel__label">{t('info.outline')}</span>
          <ul className="outline-list">
            {outline.length ? (
              outline.map((item, index) => (
                <li key={`${item.slug}-${item.depth}-${index}`} style={{ paddingLeft: `${(item.depth - 1) * 12}px` }}>
                  {item.text}
                </li>
              ))
            ) : (
              <li>{t('info.noHeadings')}</li>
            )}
          </ul>
        </div>
      </aside>

      <section className="workspace">
        <EditorSurface
          key={editorSeed}
          initialMarkdown={documentState.markdown}
          onMarkdownChange={handleMarkdownChange}
          onReady={setEditor}
        />
      </section>
    </main>
  );
}
