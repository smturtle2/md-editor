import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';
import { markdownToHtml, editorJsonToMarkdown } from '../lib/markdown';
import { BlockEdit } from '../extensions/BlockEdit';
import { CalloutBlock } from '../extensions/CalloutBlock';
import { EditorCodeBlock } from '../extensions/CodeBlock';
import { MermaidBlock } from '../extensions/MermaidBlock';
import { MathBlock } from '../extensions/MathBlock';
import { useI18n } from '../i18n';

interface EditorSurfaceProps {
  initialMarkdown: string;
  onMarkdownChange(markdown: string): void;
  onReady(editor: Editor | null): void;
}

export function EditorSurface({ initialMarkdown, onMarkdownChange, onReady }: EditorSurfaceProps) {
  const { t } = useI18n();
  const editor = useEditor({
    immediatelyRender: false,
    content: markdownToHtml(initialMarkdown),
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        dropcursor: {
          color: '#111111',
          width: 2,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: t('editor.placeholder'),
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      EditorCodeBlock,
      BlockEdit,
      CalloutBlock,
      MermaidBlock,
      MathBlock,
    ],
    editorProps: {
      attributes: {
        class: 'folio-prosemirror',
      },
    },
    onCreate: ({ editor: currentEditor }) => {
      onReady(currentEditor);
    },
    onUpdate: ({ editor: currentEditor }) => {
      onMarkdownChange(editorJsonToMarkdown(currentEditor.getJSON()));
    },
  });

  useEffect(() => {
    return () => {
      onReady(null);
    };
  }, [onReady]);

  return (
    <div className="editor-surface">
      <div className="editor-surface__canvas">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
