import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { useBlockEditState } from './useBlockEditState';

let mermaidModulePromise: Promise<(typeof import('mermaid'))['default']> | null = null;

async function getMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import('mermaid').then((module) => {
      module.default.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: {
          primaryColor: '#ffffff',
          primaryBorderColor: '#111111',
          lineColor: '#111111',
          mainBkg: '#ffffff',
          secondaryColor: '#f4f4f4',
          tertiaryColor: '#f8f8f8',
          fontFamily: 'IBM Plex Mono',
        },
      });
      return module.default;
    });
  }

  return mermaidModulePromise;
}

export function MermaidBlockView({ editor, getPos, node, updateAttributes, selected }: NodeViewProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(String(node.attrs.code ?? 'flowchart LR\n  Start --> Finish'));
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const renderId = useMemo(() => `folio-mermaid-${Math.random().toString(36).slice(2)}`, []);
  const mounted = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const ignoreNextBlurRef = useRef(false);
  const blockEditState = useBlockEditState(editor);
  const position = typeof getPos === 'function' ? getPos() : null;
  const hasPosition = typeof position === 'number';
  const isEditing = hasPosition && blockEditState.pos === position;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isEditing) {
      ignoreNextBlurRef.current = false;
      setDraft(String(node.attrs.code ?? ''));
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing, node.attrs.code]);

  function commitDraft(nextDraft: string) {
    ignoreNextBlurRef.current = true;
    updateAttributes({ code: nextDraft });
    editor.commands.stopEditingBlock();
  }

  function cancelEdit() {
    ignoreNextBlurRef.current = true;
    setDraft(String(node.attrs.code ?? ''));
    editor.commands.stopEditingBlock();
  }

  useEffect(() => {
    const source = String(node.attrs.code ?? '');
    setDraft(source);

    let cancelled = false;

    getMermaid()
      .then((mermaid) => mermaid.render(renderId, source || 'flowchart LR\n  Draft --> Diagram'))
      .then((result) => {
        if (!cancelled && mounted.current) {
          setSvg(result.svg);
          setError('');
        }
      })
      .catch((renderError) => {
        if (!cancelled && mounted.current) {
          setError(renderError instanceof Error ? renderError.message : t('mermaid.renderError'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [node.attrs.code, renderId, t]);

  return (
    <NodeViewWrapper
      className={clsx('diagram-node', selected && 'is-selected', isEditing && 'is-editing')}
      onDoubleClick={() => {
        if (isEditing || !hasPosition) {
          return;
        }

        editor.chain().focus().setNodeSelection(position).startEditingBlockAt(position).run();
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="block-source-editor"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (ignoreNextBlurRef.current) {
              ignoreNextBlurRef.current = false;
              return;
            }

            commitDraft(draft);
          }}
          onKeyDown={(event) => {
            if (event.ctrlKey && event.key === 'Enter') {
              event.preventDefault();
              commitDraft(draft);
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              cancelEdit();
            }
          }}
          spellCheck={false}
        />
      ) : (
        <div className="diagram-node__render" contentEditable={false}>
          {error ? <p className="diagram-node__error">{error}</p> : <div dangerouslySetInnerHTML={{ __html: svg }} />}
        </div>
      )}
    </NodeViewWrapper>
  );
}
