import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CalloutBlockView } from '../components/nodes/CalloutBlockView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    calloutBlock: {
      insertCallout: (attrs?: { tone?: string; title?: string }) => ReturnType;
      setCalloutTone: (tone: string) => ReturnType;
    };
  }
}

export const CalloutBlock = Node.create({
  name: 'calloutBlock',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      tone: {
        default: 'note',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'section[data-callout-block]',
        getAttrs: (element: unknown) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }
          return {
            tone: element.dataset.tone ?? 'note',
          };
        },
        contentElement: 'div[data-callout-body]',
      } as never,
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'section',
      mergeAttributes(HTMLAttributes, {
        'data-callout-block': 'true',
        'data-tone': HTMLAttributes.tone,
      }),
      ['div', { 'data-callout-body': 'true' }, 0],
    ];
  },

  addCommands() {
    return {
      insertCallout:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              tone: attrs?.tone ?? 'note',
            },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: attrs?.title ?? 'Note' }],
              },
            ],
          }),
      setCalloutTone:
        (tone) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { tone }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutBlockView);
  },
});
