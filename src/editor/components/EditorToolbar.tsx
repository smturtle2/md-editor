import type { Editor } from '@tiptap/react';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import {
  Bold,
  Code2,
  FileCode2,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Sigma,
  SquareSplitHorizontal,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { getBlockEditState } from '../extensions/BlockEdit';
import { useEditorRevision } from '../hooks/useEditorRevision';
import { TooltipButton } from './TooltipButton';

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolButtonProps {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick(): void;
  children: ReactNode;
}

function ToolButton({ active, disabled, label, onClick, children }: ToolButtonProps) {
  return (
    <TooltipButton
      tooltip={label}
      className={clsx('tool-button', active && 'is-active')}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </TooltipButton>
  );
}

const CALLOUT_TONES = ['note', 'tip', 'warning', 'important'] as const;
const CALLOUT_TONE_LABELS = {
  note: 'callout.note',
  tip: 'callout.tip',
  warning: 'callout.warning',
  important: 'callout.important',
} as const;

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const { t } = useI18n();
  useEditorRevision(editor);

  const blockEditState = editor ? getBlockEditState(editor) : { pos: null, type: null };
  const isCalloutSelected = Boolean(editor?.isActive('calloutBlock'));

  return (
    <div className="toolbar-strip">
      <div className="toolbar-group">
        <ToolButton
          label={t('toolbar.heading1')}
          disabled={!editor}
          active={editor?.isActive('heading', { level: 1 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.heading2')}
          disabled={!editor}
          active={editor?.isActive('heading', { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </ToolButton>
      </div>

      <div className="toolbar-group">
        <ToolButton
          label={t('toolbar.bold')}
          disabled={!editor}
          active={editor?.isActive('bold')}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.italic')}
          disabled={!editor}
          active={editor?.isActive('italic')}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.underline')}
          disabled={!editor}
          active={editor?.isActive('underline')}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.strike')}
          disabled={!editor}
          active={editor?.isActive('strike')}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.link')}
          disabled={!editor}
          active={editor?.isActive('link')}
          onClick={() => {
            if (!editor) {
              return;
            }

            const current = editor.getAttributes('link').href as string | undefined;
            const next = window.prompt(t('toolbar.linkPrompt'), current ?? 'https://');

            if (next === null) {
              return;
            }

            if (!next.trim()) {
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              return;
            }

            editor.chain().focus().extendMarkRange('link').setLink({ href: next }).run();
          }}
        >
          <Link2 size={16} />
        </ToolButton>
      </div>

      <div className="toolbar-group">
        <ToolButton
          label={t('toolbar.bulletList')}
          disabled={!editor}
          active={editor?.isActive('bulletList')}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.orderedList')}
          disabled={!editor}
          active={editor?.isActive('orderedList')}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.checklist')}
          disabled={!editor}
          active={editor?.isActive('taskList')}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
        >
          <ListChecks size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.quote')}
          disabled={!editor}
          active={editor?.isActive('blockquote')}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolButton>
      </div>

      <div className="toolbar-group">
        <ToolButton
          label={t('toolbar.codeBlock')}
          disabled={!editor}
          active={editor?.isActive('codeBlock')}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.table')}
          disabled={!editor}
          active={editor?.isActive('table')}
          onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table2 size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.callout')}
          disabled={!editor}
          active={editor?.isActive('calloutBlock')}
          onClick={() => editor?.chain().focus().insertCallout({ tone: 'note', title: t('callout.note') }).run()}
        >
          <Highlighter size={16} />
        </ToolButton>
        <ToolButton label={t('toolbar.mermaid')} disabled={!editor} onClick={() => editor?.chain().focus().insertMermaid().run()}>
          <SquareSplitHorizontal size={16} />
        </ToolButton>
        <ToolButton label={t('toolbar.math')} disabled={!editor} onClick={() => editor?.chain().focus().insertMath().run()}>
          <Sigma size={16} />
        </ToolButton>
        <ToolButton
          label={t('toolbar.horizontalRule')}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <FileCode2 size={16} />
        </ToolButton>
      </div>

      {isCalloutSelected ? (
        <div className="toolbar-group toolbar-group--context">
          {CALLOUT_TONES.map((tone) => (
            <button
              key={tone}
              type="button"
              className={clsx('tool-pill', editor?.getAttributes('calloutBlock').tone === tone && 'is-active')}
              aria-label={t(CALLOUT_TONE_LABELS[tone])}
              onClick={() => editor?.chain().focus().setCalloutTone(tone).run()}
            >
              {t(CALLOUT_TONE_LABELS[tone])}
            </button>
          ))}
        </div>
      ) : null}

      {blockEditState.pos !== null ? (
        <div className="toolbar-group toolbar-group--context">
          <span className="toolbar-hint">{t('toolbar.blockEditHint')}</span>
        </div>
      ) : null}
    </div>
  );
}
