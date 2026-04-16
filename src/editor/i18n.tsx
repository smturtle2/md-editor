import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Locale = 'en' | 'ko';

type MessageParams = Record<string, string | number>;

const enMessages = {
  'app.windowTitle': 'md-editor',
  'app.loadingScreen': 'Loading md-editor…',
  'app.brand': 'md-editor',
  'app.import': 'Import',
  'app.export': 'Export',
  'app.info': 'Info',
  'app.undo': 'Undo',
  'app.redo': 'Redo',
  'app.documentTitle': 'Document title',
  'save.loading': 'Loading',
  'save.ready': 'Synced',
  'save.dirty': 'Unsaved',
  'save.saving': 'Saving',
  'save.saved': 'Saved',
  'save.error': 'Save failed',
  'info.updated': 'Updated',
  'info.document': 'Document',
  'info.outline': 'Outline',
  'info.noEdits': 'No edits yet',
  'info.noHeadings': 'No headings yet',
  'info.words': '{count} words',
  'info.characters': '{count} chars',
  'info.readingMinutes': '{count} min read',
  'info.headings': '{count} headings',
  'editor.placeholder': 'Write directly into the rendered canvas…',
  'toolbar.heading1': 'Heading 1',
  'toolbar.heading2': 'Heading 2',
  'toolbar.bold': 'Bold',
  'toolbar.italic': 'Italic',
  'toolbar.underline': 'Underline',
  'toolbar.strike': 'Strike',
  'toolbar.link': 'Link',
  'toolbar.linkPrompt': 'Link URL',
  'toolbar.bulletList': 'Bullet list',
  'toolbar.orderedList': 'Ordered list',
  'toolbar.checklist': 'Checklist',
  'toolbar.quote': 'Quote',
  'toolbar.codeBlock': 'Code block',
  'toolbar.table': 'Table',
  'toolbar.callout': 'Callout',
  'toolbar.mermaid': 'Mermaid',
  'toolbar.math': 'Math',
  'toolbar.horizontalRule': 'Horizontal rule',
  'toolbar.blockEditHint': 'Ctrl+Enter apply · Esc cancel',
  'codeBlock.languageLabel': 'Code block language',
  'codeBlock.languagePlaceholder': 'language',
  'callout.note': 'Note',
  'callout.tip': 'Tip',
  'callout.warning': 'Warning',
  'callout.important': 'Important',
  'document.untitled': 'Untitled document',
  'document.imported': 'Imported document',
  'mermaid.renderError': 'Unable to render diagram',
};

export type MessageKey = keyof typeof enMessages;

type Messages = Record<MessageKey, string>;

const koMessages: Messages = {
  'app.windowTitle': 'md-editor',
  'app.loadingScreen': 'md-editor 불러오는 중…',
  'app.brand': 'md-editor',
  'app.import': '가져오기',
  'app.export': '내보내기',
  'app.info': '정보',
  'app.undo': '실행 취소',
  'app.redo': '다시 실행',
  'app.documentTitle': '문서 제목',
  'save.loading': '불러오는 중',
  'save.ready': '동기화됨',
  'save.dirty': '저장 안 됨',
  'save.saving': '저장 중',
  'save.saved': '저장됨',
  'save.error': '저장 실패',
  'info.updated': '최근 수정',
  'info.document': '문서',
  'info.outline': '개요',
  'info.noEdits': '아직 수정 내역 없음',
  'info.noHeadings': '아직 제목 없음',
  'info.words': '{count} 단어',
  'info.characters': '{count} 글자',
  'info.readingMinutes': '읽기 {count}분',
  'info.headings': '제목 {count}개',
  'editor.placeholder': '렌더링된 캔버스에서 바로 수정하세요…',
  'toolbar.heading1': '제목 1',
  'toolbar.heading2': '제목 2',
  'toolbar.bold': '굵게',
  'toolbar.italic': '기울임',
  'toolbar.underline': '밑줄',
  'toolbar.strike': '취소선',
  'toolbar.link': '링크',
  'toolbar.linkPrompt': '링크 URL',
  'toolbar.bulletList': '글머리 목록',
  'toolbar.orderedList': '번호 목록',
  'toolbar.checklist': '체크리스트',
  'toolbar.quote': '인용',
  'toolbar.codeBlock': '코드 블록',
  'toolbar.table': '표',
  'toolbar.callout': '콜아웃',
  'toolbar.mermaid': 'Mermaid',
  'toolbar.math': '수식',
  'toolbar.horizontalRule': '구분선',
  'toolbar.blockEditHint': 'Ctrl+Enter 적용 · Esc 취소',
  'codeBlock.languageLabel': '코드 블록 언어',
  'codeBlock.languagePlaceholder': '언어',
  'callout.note': '메모',
  'callout.tip': '팁',
  'callout.warning': '주의',
  'callout.important': '중요',
  'document.untitled': '제목 없는 문서',
  'document.imported': '가져온 문서',
  'mermaid.renderError': '도표를 렌더링할 수 없습니다.',
};

export const messages: Record<Locale, Messages> = {
  en: enMessages,
  ko: koMessages,
};

function formatMessage(template: string, params?: MessageParams) {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ''));
}

export function resolveLocale(input?: string): Locale {
  if (!input) {
    return 'en';
  }

  return input.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

function detectLocale() {
  const chromeLocale =
    typeof globalThis.chrome !== 'undefined' && typeof globalThis.chrome.i18n?.getUILanguage === 'function'
      ? globalThis.chrome.i18n.getUILanguage()
      : undefined;

  return resolveLocale(chromeLocale ?? globalThis.navigator?.language);
}

export function getMessage(locale: Locale, key: MessageKey, params?: MessageParams) {
  return formatMessage(messages[locale][key], params);
}

export function getWelcomeMarkdown(locale: Locale) {
  if (locale === 'ko') {
    return `# md-editor

최종 렌더에 가깝게 유지되는 깔끔한 마크다운 편집기입니다.

> [!NOTE] 시작하기
> 위 툴바에서 구조와 서식을 적용하세요.
> 캔버스는 문서 자체에만 집중한 상태로 유지됩니다.

## 시작하기

- 헤더에서 마크다운 파일을 가져오거나 내보낼 수 있습니다.
- 툴바로 제목, 목록, 링크, 표, 블록을 넣을 수 있습니다.
- mermaid 또는 수식 블록은 더블 클릭해서 소스를 수정합니다.

### 체크리스트

- [x] 렌더 중심 편집
- [x] Rust/WASM 문서 코어
- [x] Chrome 확장 셸

## 표

| 영역 | 역할 |
| --- | --- |
| 헤더 | 파일 동작과 문서 상태 |
| 툴바 | 서식과 삽입 |
| 캔버스 | 집중해서 쓰기 |

\`\`\`mermaid
flowchart LR
  초안 --> 검토
  검토 --> 내보내기
\`\`\`

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$
`;
  }

  return `# md-editor

Clean markdown editing that stays close to the final render.

> [!NOTE] Start here
> Use the toolbar above for structure and formatting.
> Keep the canvas focused on the document itself.

## Start here

- Import or export a markdown file from the header.
- Use the toolbar for headings, lists, links, tables, and blocks.
- Double click a mermaid or math block to edit its source.

### Checklist

- [x] Rendered editing
- [x] Rust/WASM document core
- [x] Chrome extension shell

## Table

| Surface | Purpose |
| --- | --- |
| Header | File actions and document state |
| Toolbar | Formatting and insertion |
| Canvas | Focused writing |

\`\`\`mermaid
flowchart LR
  Draft --> Review
  Review --> Export
\`\`\`

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$
`;
}

interface I18nContextValue {
  locale: Locale;
  t(key: MessageKey, params?: MessageParams): string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  locale?: Locale;
}

export function I18nProvider({ children, locale: forcedLocale }: I18nProviderProps) {
  const [detectedLocale] = useState(detectLocale);
  const locale = forcedLocale ?? detectedLocale;

  const t = useCallback(
    (key: MessageKey, params?: MessageParams) => getMessage(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      t,
    }),
    [locale, t],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = getMessage(locale, 'app.windowTitle');
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return value;
}
