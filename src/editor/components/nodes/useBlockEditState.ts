import type { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { getBlockEditState, type BlockEditState } from '../../extensions/BlockEdit';

export function useBlockEditState(editor: Editor) {
  const [state, setState] = useState<BlockEditState>(() => getBlockEditState(editor));

  useEffect(() => {
    const refresh = () => {
      setState(getBlockEditState(editor));
    };

    refresh();
    editor.on('transaction', refresh);

    return () => {
      editor.off('transaction', refresh);
    };
  }, [editor]);

  return state;
}
