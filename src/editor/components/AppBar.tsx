import type { Editor } from '@tiptap/react';
import clsx from 'clsx';
import { Download, FileUp, Info, Redo2, Undo2 } from 'lucide-react';
import { useI18n } from '../i18n';
import { TooltipButton } from './TooltipButton';
import { useEditorRevision } from '../hooks/useEditorRevision';
import type { SaveState } from '../types';

interface AppBarProps {
  title: string;
  saveState: SaveState;
  editor: Editor | null;
  infoOpen: boolean;
  onTitleChange(title: string): void;
  onImport(): void;
  onExport(): void;
  onToggleInfo(): void;
}

function saveLabel(saveState: SaveState, t: ReturnType<typeof useI18n>['t']) {
  switch (saveState) {
    case 'loading':
      return t('save.loading');
    case 'ready':
      return t('save.ready');
    case 'dirty':
      return t('save.dirty');
    case 'saving':
      return t('save.saving');
    case 'saved':
      return t('save.saved');
    case 'error':
      return t('save.error');
    default:
      return t('save.ready');
  }
}

export function AppBar({
  title,
  saveState,
  editor,
  infoOpen,
  onTitleChange,
  onImport,
  onExport,
  onToggleInfo,
}: AppBarProps) {
  const { t } = useI18n();
  useEditorRevision(editor);

  return (
    <header className="app-bar">
      <div className="app-bar__brand">
        <span className="app-bar__brand-mark">{t('app.brand')}</span>
        <input
          className="app-bar__title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          aria-label={t('app.documentTitle')}
          spellCheck={false}
        />
        <span className={clsx('app-bar__state', `is-${saveState}`)}>{saveLabel(saveState, t)}</span>
      </div>

      <div className="app-bar__actions">
        <TooltipButton tooltip={t('app.import')} aria-label={t('app.import')} onClick={onImport}>
          <FileUp size={16} />
          {t('app.import')}
        </TooltipButton>
        <TooltipButton tooltip={t('app.export')} aria-label={t('app.export')} onClick={onExport}>
          <Download size={16} />
          {t('app.export')}
        </TooltipButton>
        <TooltipButton
          tooltip={t('app.undo')}
          aria-label={t('app.undo')}
          disabled={!editor?.can().undo()}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 size={16} />
        </TooltipButton>
        <TooltipButton
          tooltip={t('app.redo')}
          aria-label={t('app.redo')}
          disabled={!editor?.can().redo()}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 size={16} />
        </TooltipButton>
        <TooltipButton
          tooltip={t('app.info')}
          aria-label={t('app.info')}
          className={clsx(infoOpen && 'is-active')}
          onClick={onToggleInfo}
        >
          <Info size={16} />
          {t('app.info')}
        </TooltipButton>
      </div>
    </header>
  );
}
