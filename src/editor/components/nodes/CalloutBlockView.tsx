import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import clsx from 'clsx';

export function CalloutBlockView({ node, selected }: NodeViewProps) {
  const tone = String(node.attrs.tone ?? 'note');

  return (
    <NodeViewWrapper className={clsx('callout-node', `callout-node--${tone}`, selected && 'is-selected')}>
      <NodeViewContent className="callout-node__content" />
    </NodeViewWrapper>
  );
}
