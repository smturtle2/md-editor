import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extensionName__',
  version: '0.1.1',
  description: '__MSG_extensionDescription__',
  permissions: ['storage', 'tabs'],
  action: {
    default_title: '__MSG_actionOpenEditor__',
  },
  options_page: 'editor.html',
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
});
