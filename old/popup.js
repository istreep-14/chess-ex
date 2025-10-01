document.addEventListener('DOMContentLoaded', () => {
  const autoAnalyzeCheckbox = document.getElementById('autoAnalyze');
  const analyzeNowButton = document.getElementById('analyzeNow');
  const status = document.getElementById('status');
  
  // Load saved settings
  chrome.storage.sync.get(['autoAnalyze'], (result) => {
    autoAnalyzeCheckbox.checked = result.autoAnalyze !== false;
  });
  
  // Save settings when changed
  autoAnalyzeCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({
      autoAnalyze: autoAnalyzeCheckbox.checked
    }, () => {
      status.textContent = autoAnalyzeCheckbox.checked ? 
        'Auto-analysis enabled ✓' : 
        'Auto-analysis disabled';
    });
  });
  
  // Manual trigger button
  analyzeNowButton.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0].url.includes('lichess.org')) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'requestAnalysis'});
        status.textContent = 'Analysis requested ✓';
        setTimeout(() => {
          status.textContent = 'Extension active ✓';
        }, 2000);
      } else {
        status.textContent = 'Not on a Lichess page';
      }
    });
  });
});
