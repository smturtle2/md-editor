const EDITOR_URL = chrome.runtime.getURL('editor.html');

async function openOrFocusEditor() {
  const tabs = await chrome.tabs.query({});
  const existing = tabs.find((tab) => tab.url?.startsWith(EDITOR_URL));

  if (existing?.id) {
    await chrome.tabs.update(existing.id, { active: true });
    if (existing.windowId !== undefined) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }
    return;
  }

  await chrome.tabs.create({ url: EDITOR_URL });
}

chrome.action.onClicked.addListener(() => {
  void openOrFocusEditor();
});
