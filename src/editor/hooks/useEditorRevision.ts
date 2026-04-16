import type { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';

export function useEditorRevision(editor: Editor | null) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const refresh = () => {
      setRevision((current) => current + 1);
    };

    refresh();
    editor.on('transaction', refresh);
    editor.on('selectionUpdate', refresh);

    return () => {
      editor.off('transaction', refresh);
      editor.off('selectionUpdate', refresh);
    };
  }, [editor]);

  return revision;
}
