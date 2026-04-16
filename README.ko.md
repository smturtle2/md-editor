# md-editor

[English README](./README.md)

`md-editor`는 React, TypeScript, Rust/WASM 문서 코어로 만든 Chrome 확장 기반 마크다운 에디터입니다.
raw markdown 편집 화면 대신 최종 렌더에 가까운 문서 캔버스를 유지하면서도 구조화된 편집 기능을 제공합니다.

## 주요 기능

- raw markdown 모드 대신 렌더 중심 편집 화면
- 문서 액션과 서식 도구가 있는 2단 상단 크롬
- mermaid, 수식 블록의 제자리 편집
- 언어 지정이 가능한 fenced code block과 syntax highlighting
- Chrome Extension Manifest V3 기반 실행 구조
- Rust/WASM 기반 markdown 파싱 및 직렬화 코어
- 영어/한국어 UI 다국어 지원

## 프로젝트 구성

- `src/editor`: React 에디터 UI, Tiptap 확장, 스타일, i18n
- `src/background.ts`: Chrome 확장 백그라운드 워커
- `src/manifest.ts`: MV3 매니페스트 정의
- `wasm`: Rust/WASM 문서 코어

## 요구 사항

- Node.js 20 이상
- npm
- Rust stable
- `wasm32-unknown-unknown` target
- `wasm-pack`
- Chrome

## 로컬 개발

```bash
npm install
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
npm run dev
```

## 검증 명령

```bash
npm run check
npm test
cargo test --manifest-path wasm/Cargo.toml
npm run build
```

## 확장 실행 방법

1. `npm run build`로 빌드합니다.
2. `chrome://extensions`를 엽니다.
3. `개발자 모드`를 켭니다.
4. `압축해제된 확장 프로그램을 로드합니다`를 클릭합니다.
5. 생성된 `dist/` 디렉터리를 선택합니다.

## 릴리즈 흐름

이 저장소에는 CI와 릴리즈를 위한 GitHub Actions가 포함됩니다.

- `ci.yml`: push와 pull request에서 TypeScript 체크, 테스트, Rust 테스트, 프로덕션 빌드를 실행합니다.
- `release.yml`: `v0.1.0` 같은 태그가 push되면 확장을 빌드하고 `dist/`를 zip으로 패키징한 뒤, 해당 파일을 첨부한 GitHub Release를 생성합니다.

수동으로 새 릴리즈를 만들 때는 다음 순서로 진행합니다.

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 라이선스

MIT. 자세한 내용은 [LICENSE](./LICENSE)를 참고하세요.
