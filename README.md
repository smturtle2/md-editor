# md-editor

[한국어 README](./README.ko.md)

`md-editor` is a Chrome extension markdown editor built with React, TypeScript, and a Rust/WASM document core.
It keeps the canvas close to the final render while still supporting structured editing for markdown blocks.

## Features

- Render-first editing surface instead of raw markdown mode
- Clean two-row editor chrome with formatting tools and document actions
- Mermaid and math blocks with in-place editing
- Language-aware fenced code blocks with syntax highlighting
- Chrome Extension Manifest V3 shell
- Rust/WASM markdown parsing and serialization core
- English and Korean UI localization

## Project Structure

- `src/editor`: React editor UI, Tiptap extensions, styles, i18n
- `src/background.ts`: Chrome extension background worker
- `src/manifest.ts`: MV3 manifest definition
- `wasm`: Rust/WASM document core

## Requirements

- Node.js 20+
- npm
- Rust stable
- `wasm32-unknown-unknown` target
- `wasm-pack`
- Chrome

## Local Development

```bash
npm install
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
npm run dev
```

## Verification

```bash
npm run check
npm test
cargo test --manifest-path wasm/Cargo.toml
npm run build
```

## Load the Extension

1. Build the project with `npm run build`.
2. Open `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the generated `dist/` directory.

## Release Flow

This repository ships with GitHub Actions for CI and releases.

- `ci.yml` runs TypeScript checks, tests, Rust tests, and a production build on pushes and pull requests.
- `release.yml` runs on tags like `v0.1.1`, builds the extension, packages `dist/` as a zip file, and creates a GitHub Release with the artifact attached.

To cut a new release manually:

```bash
git tag v0.1.1
git push origin v0.1.1
```

## License

MIT. See [LICENSE](./LICENSE).
