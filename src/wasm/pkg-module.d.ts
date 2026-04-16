declare module '../../wasm/pkg/md_editor_wasm.js' {
  import type { DocSnapshot } from '../editor/types';

  export default function init(
    input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module,
  ): Promise<unknown>;
  export function parse_markdown(markdown: string): DocSnapshot;
  export function serialize_markdown(snapshot: DocSnapshot): string;
  export function normalize_import(markdown: string): DocSnapshot;
  export function build_outline(markdown: string): string;
  export function document_stats(markdown: string): string;
}
