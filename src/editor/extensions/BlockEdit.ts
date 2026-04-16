import { Extension, type Editor } from '@tiptap/core';
import { NodeSelection, Plugin, PluginKey } from '@tiptap/pm/state';

export type EditableBlockType = 'mermaidBlock' | 'mathBlock';

export interface BlockEditState {
  pos: number | null;
  type: EditableBlockType | null;
}

const EMPTY_STATE: BlockEditState = {
  pos: null,
  type: null,
};

export const blockEditPluginKey = new PluginKey<BlockEditState>('blockEdit');

export function getBlockEditState(editor: Editor): BlockEditState {
  return blockEditPluginKey.getState(editor.state) ?? EMPTY_STATE;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockEdit: {
      startEditingSelectedBlock: () => ReturnType;
      startEditingBlockAt: (pos: number) => ReturnType;
      stopEditingBlock: () => ReturnType;
    };
  }
}

export const BlockEdit = Extension.create({
  name: 'blockEdit',

  addCommands() {
    return {
      startEditingSelectedBlock:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state;

          if (!(selection instanceof NodeSelection)) {
            return false;
          }

          const type = selection.node.type.name;
          if (type !== 'mermaidBlock' && type !== 'mathBlock') {
            return false;
          }

          dispatch?.(state.tr.setMeta(blockEditPluginKey, { pos: selection.from, type }));
          return true;
        },
      startEditingBlockAt:
        (pos) =>
        ({ state, dispatch }) => {
          const node = state.doc.nodeAt(pos);
          const type = node?.type.name;

          if (type !== 'mermaidBlock' && type !== 'mathBlock') {
            return false;
          }

          dispatch?.(state.tr.setMeta(blockEditPluginKey, { pos, type }));
          return true;
        },
      stopEditingBlock:
        () =>
        ({ state, dispatch }) => {
          dispatch?.(state.tr.setMeta(blockEditPluginKey, EMPTY_STATE));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<BlockEditState>({
        key: blockEditPluginKey,
        state: {
          init: () => EMPTY_STATE,
          apply(tr, value) {
            const next = tr.getMeta(blockEditPluginKey) as BlockEditState | undefined;
            return next ?? value;
          },
        },
      }),
    ];
  },
});
