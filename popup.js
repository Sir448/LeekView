const toggle = document.getElementById('toggleExtension');
const statusText = document.getElementById('label');

// 1. Load the current setting
chrome.storage.local.get(['enabled'], (result) => {
  const isEnabled = result.enabled !== false; 
  toggle.checked = isEnabled;
    statusText.innerText = isEnabled ? "Timeline View" : "List View";
});

// 2. Save and Auto-Reload on change
toggle.addEventListener('change', () => {
  const isEnabled = toggle.checked;
  
  chrome.storage.local.set({ enabled: isEnabled }, () => {
    statusText.innerText = isEnabled ? "Timeline View" : "List View";

    // Tell the current tab to reload immediately
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
});