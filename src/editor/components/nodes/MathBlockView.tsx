import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import clsx from 'clsx';
import katex from 'katex';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBlockEditState } from './useBlockEditState';

export function MathBlockView({ editor, getPos, node, updateAttributes, selected }: NodeViewProps) {
  const [draft, setDraft] = useState(String(node.attrs.formula ?? '\\int_0^1 x^2 \\, dx = \\frac{1}{3}'));
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const ignoreNextBlurRef = useRef(false);
  const blockEditState = useBlockEditState(editor);
  const position = typeof getPos === 'function' ? getPos() : null;
  const hasPosition = typeof position === 'number';
  const isEditing = hasPosition && blockEditState.pos === position;

  useEffect(() => {
    if (isEditing) {
      ignoreNextBlurRef.current = false;
      setDraft(String(node.attrs.formula ?? ''));
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing, node.attrs.formula]);

  function commitDraft(nextDraft: string) {
    ignoreNextBlurRef.current = true;
    updateAttributes({ formula: nextDraft });
    editor.commands.stopEditingBlock();
  }

  function cancelEdit() {
    ignoreNextBlurRef.current = true;
    setDraft(String(node.attrs.formula ?? ''));
    editor.commands.stopEditingBlock();
  }

  const rendered = useMemo(
    () =>
      katex.renderToString(String(node.attrs.formula ?? draft), {
        displayMode: true,
        throwOnError: false,
      }),
    [draft, node.attrs.formula],
  );

  return (
    <NodeViewWrapper
      className={clsx('math-node', selected && 'is-selected', isEditing && 'is-editing')}
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
        <div className="math-node__render" contentEditable={false} dangerouslySetInnerHTML={{ __html: rendered }} />
      )}
    </NodeViewWrapper>
  );
}
