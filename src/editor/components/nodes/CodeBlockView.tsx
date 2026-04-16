import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';

function normalizeLanguage(value: string) {
  return value.trim().split(/\s+/)[0] ?? '';
}

export function CodeBlockView({ node, selected, updateAttributes }: NodeViewProps) {
  const { t } = useI18n();
  const [languageDraft, setLanguageDraft] = useState(String(node.attrs.language ?? ''));

  useEffect(() => {
    setLanguageDraft(String(node.attrs.language ?? ''));
  }, [node.attrs.language]);

  function commitLanguage(nextValue: string) {
    const normalized = normalizeLanguage(nextValue);
    updateAttributes({ language: normalized || null });
    setLanguageDraft(normalized);
  }

  return (
    <NodeViewWrapper className={clsx('code-block-node', selected && 'is-selected')}>
      <div className="code-block-node__header" contentEditable={false}>
        <input
          className="code-block-node__language"
          value={languageDraft}
          placeholder={t('codeBlock.languagePlaceholder')}
          aria-label={t('codeBlock.languageLabel')}
          spellCheck={false}
          onChange={(event) => setLanguageDraft(event.target.value)}
          onBlur={(event) => commitLanguage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitLanguage((event.target as HTMLInputElement).value);
              (event.target as HTMLInputElement).blur();
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              setLanguageDraft(String(node.attrs.language ?? ''));
              (event.target as HTMLInputElement).blur();
            }
          }}
        />
      </div>
      <pre className="code-block-node__pre">
        <NodeViewContent className="code-block-node__content" />
      </pre>
    </NodeViewWrapper>
  );
}
