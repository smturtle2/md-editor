import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MermaidBlockView } from '../components/nodes/MermaidBlockView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mermaidBlock: {
      insertMermaid: (code?: string) => ReturnType;
    };
  }
}

export const MermaidBlock = Node.create({
  name: 'mermaidBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      code: {
        default: 'flowchart LR\n  Draft --> Ship',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-mermaid-block]',
        getAttrs: (element: unknown) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }
          return {
            code: element.innerText.trim(),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, { 'data-mermaid-block': 'true' }),
      ['pre', {}, HTMLAttributes.code],
    ];
  },

  addCommands() {
    return {
      insertMermaid:
        (code) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              code: code ?? 'flowchart LR\n  Draft --> Ship',
            },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidBlockView);
  },
});
