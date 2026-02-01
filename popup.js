const toggle = document.getElementById('toggleExtension');
const statusText = document.getElementById('label');

chrome.storage.local.get(['enabled'], (result) => {
  const isEnabled = result.enabled !== false; 
  toggle.checked = isEnabled;
    statusText.innerText = isEnabled ? "Timeline View" : "List View";
});

toggle.addEventListener('change', () => {
  const isEnabled = toggle.checked;

  chrome.storage.local.set({ enabled: isEnabled }, () => {
    statusText.innerText = isEnabled ? "Timeline View" : "List View";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
});