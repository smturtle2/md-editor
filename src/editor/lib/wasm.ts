import {
  buildBlocksFromMarkdown,
  buildOutlineFromMarkdown,
  getDocStats,
  normalizeMarkdown,
} from './markdown';
import type { DocSnapshot } from '../types';

interface WasmModule {
  default(input?: RequestInfo | URL | Response | BufferSource | WebAssembly.Module): Promise<unknown>;
  parse_markdown(markdown: string): DocSnapshot;
  serialize_markdown(snapshot: DocSnapshot): string;
  normalize_import(markdown: string): DocSnapshot;
  build_outline(markdown: string): string;
  document_stats(markdown: string): string;
}

let wasmPromise: Promise<WasmModule | null> | null = null;

async function loadWasmModule() {
  if (!wasmPromise) {
    wasmPromise = import('../../wasm/pkg/md_editor_wasm.js')
      .then(async (module) => {
        const wasmModule = module as unknown as WasmModule;
        await wasmModule.default();
        return wasmModule;
      })
      .catch(() => null);
  }

  return wasmPromise;
}

export async function parseMarkdown(markdown: string): Promise<DocSnapshot> {
  const wasm = await loadWasmModule();
  if (wasm) {
    return wasm.parse_markdown(markdown);
  }

  const source = normalizeMarkdown(markdown);
  return {
    source,
    blocks: buildBlocksFromMarkdown(source),
    outline: buildOutlineFromMarkdown(source),
    stats: getDocStats(source),
  };
}

export async function normalizeImport(markdown: string): Promise<DocSnapshot> {
  const wasm = await loadWasmModule();
  if (wasm) {
    return wasm.normalize_import(markdown);
  }

  return parseMarkdown(markdown);
}

export async function serializeMarkdown(snapshot: DocSnapshot): Promise<string> {
  const wasm = await loadWasmModule();
  if (wasm) {
    return wasm.serialize_markdown(snapshot);
  }

  return normalizeMarkdown(snapshot.source);
}

export async function buildOutline(markdown: string) {
  const wasm = await loadWasmModule();
  if (wasm) {
    return JSON.parse(wasm.build_outline(markdown)) as DocSnapshot['outline'];
  }

  return buildOutlineFromMarkdown(markdown);
}

export async function documentStats(markdown: string) {
  const wasm = await loadWasmModule();
  if (wasm) {
    return JSON.parse(wasm.document_stats(markdown)) as DocSnapshot['stats'];
  }

  return getDocStats(markdown);
}
