import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MathBlockView } from '../components/nodes/MathBlockView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathBlock: {
      insertMath: (formula?: string) => ReturnType;
    };
  }
}

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      formula: {
        default: '\\int_0^1 x^2 \\, dx = \\frac{1}{3}',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-math-block]',
        getAttrs: (element: unknown) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }
          return {
            formula: element.innerText.trim(),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(HTMLAttributes, { 'data-math-block': 'true' }),
      ['pre', {}, HTMLAttributes.formula],
    ];
  },

  addCommands() {
    return {
      insertMath:
        (formula) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              formula: formula ?? '\\int_0^1 x^2 \\, dx = \\frac{1}{3}',
            },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView);
  },
});
