// ツールバーのアイコンを押すとパネルを開閉。設定ページを開く中継。
chrome.action.onClicked.addListener((tab) => {
  if (tab && tab.id != null) chrome.tabs.sendMessage(tab.id, { type: 'hlx-toggle' }).catch(() => {});
});

chrome.runtime.onMessage.addListener((m) => {
  if (m && m.type === 'hlx-open-options') chrome.runtime.openOptionsPage();
});
