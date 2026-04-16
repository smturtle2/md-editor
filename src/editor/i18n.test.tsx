import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AppBar } from './components/AppBar';
import { EditorToolbar } from './components/EditorToolbar';
import { I18nProvider, messages, resolveLocale } from './i18n';

describe('i18n', () => {
  it('resolves Korean locales and falls back to English', () => {
    expect(resolveLocale('ko')).toBe('ko');
    expect(resolveLocale('ko-KR')).toBe('ko');
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('fr-FR')).toBe('en');
    expect(resolveLocale()).toBe('en');
  });

  it('keeps English and Korean catalogs in sync', () => {
    expect(Object.keys(messages.ko)).toEqual(Object.keys(messages.en));
  });

  it('renders Korean toolbar tooltips', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider locale="ko">
        <EditorToolbar editor={null} />
      </I18nProvider>,
    );

    expect(markup).toContain('data-tooltip="제목 1"');
    expect(markup).toContain('data-tooltip="굵게"');
    expect(markup).toContain('data-tooltip="링크"');
    expect(markup).toContain('data-tooltip="구분선"');
  });

  it('renders localized app bar labels and button titles', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider locale="ko">
        <AppBar
          title="제목 없는 문서"
          saveState="saved"
          editor={null}
          infoOpen={false}
          onTitleChange={() => {}}
          onImport={() => {}}
          onExport={() => {}}
          onToggleInfo={() => {}}
        />
      </I18nProvider>,
    );

    expect(markup).toContain('가져오기');
    expect(markup).toContain('내보내기');
    expect(markup).toContain('data-tooltip="실행 취소"');
    expect(markup).toContain('data-tooltip="다시 실행"');
    expect(markup).toContain('정보');
  });
});
