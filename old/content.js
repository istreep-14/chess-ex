(function() {
  'use strict';
  
  console.log('Lichess Auto-Analysis Extension loaded');
  
  // Configuration
  const CONFIG = {
    AUTO_ANALYZE: true,
    WAIT_TIME: 2000, // Wait 2 seconds before trying to click
    MAX_RETRIES: 5,
    RETRY_DELAY: 1000
  };
  
  /**
   * Check if we're on a game page
   */
  function isGamePage() {
    // Game URLs look like: https://lichess.org/gameId or /gameId/white
    const path = window.location.pathname;
    return /^\/[a-zA-Z0-9]{8}/.test(path);
  }
  
  /**
   * Check if analysis is already available
   */
  function hasAnalysis() {
    // Check if computer analysis toggle exists and is active
    const analysisToggle = document.querySelector('.computer-analysis');
    if (!analysisToggle) return false;
    
    // Check if evaluation bars are present
    const evalBar = document.querySelector('.eval-gauge');
    return evalBar !== null;
  }
  
  /**
   * Find and click the "Request computer analysis" button
   */
  function requestAnalysis(retryCount = 0) {
    console.log(`Attempting to request analysis (try ${retryCount + 1}/${CONFIG.MAX_RETRIES})...`);
    
    // Method 1: Look for the button in the menu
    const requestButton = document.querySelector('button.computer-analysis');
    
    if (requestButton && !hasAnalysis()) {
      console.log('Found request button, clicking...');
      requestButton.click();
      
      // Verify it worked
      setTimeout(() => {
        if (hasAnalysis()) {
          console.log('✓ Analysis requested successfully!');
          notifySuccess();
        } else {
          console.log('Analysis not detected, trying alternative method...');
          tryAlternativeMethod();
        }
      }, 1500);
      
      return true;
    }
    
    // Method 2: Look for the menu toggle if button not found
    const menuToggle = document.querySelector('button.fbt.analysis-menu');
    if (menuToggle && retryCount < CONFIG.MAX_RETRIES) {
      console.log('Opening analysis menu...');
      menuToggle.click();
      
      setTimeout(() => {
        requestAnalysis(retryCount + 1);
      }, CONFIG.RETRY_DELAY);
      
      return true;
    }
    
    // Method 3: Try keyboard shortcut
    if (retryCount < CONFIG.MAX_RETRIES) {
      console.log('Trying keyboard shortcut method...');
      tryKeyboardShortcut();
      
      setTimeout(() => {
        if (!hasAnalysis()) {
          requestAnalysis(retryCount + 1);
        }
      }, CONFIG.RETRY_DELAY);
      
      return true;
    }
    
    console.log('Could not find analysis request button');
    return false;
  }
  
  /**
   * Try alternative method using direct API
   */
  function tryAlternativeMethod() {
    const gameId = window.location.pathname.split('/')[1];
    
    // Try to trigger via fetch (might work if logged in)
    fetch(`/${gameId}/request-analysis`, {
      method: 'POST',
      credentials: 'include'
    })
    .then(response => {
      if (response.ok) {
        console.log('✓ Analysis requested via API!');
        notifySuccess();
        // Reload page to show analysis
        setTimeout(() => window.location.reload(), 2000);
      } else {
        console.log('API request failed, manual click required');
      }
    })
    .catch(err => {
      console.log('API method failed:', err);
    });
  }
  
  /**
   * Try keyboard shortcut (if Lichess supports it)
   */
  function tryKeyboardShortcut() {
    // Some sites support keyboard shortcuts for analysis
    const event = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      ctrlKey: false,
      shiftKey: false,
      altKey: false
    });
    document.dispatchEvent(event);
  }
  
  /**
   * Show notification that analysis was requested
   */
  function notifySuccess() {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #759900;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-family: 'Noto Sans', sans-serif;
      box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    `;
    notification.textContent = '✓ Computer analysis requested!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  /**
   * Main initialization
   */
  function init() {
    // Check if we're on a game page
    if (!isGamePage()) {
      console.log('Not on a game page, extension inactive');
      return;
    }
    
    console.log('On game page, checking analysis status...');
    
    // Wait for page to fully load
    setTimeout(() => {
      if (hasAnalysis()) {
        console.log('Game already has analysis');
        return;
      }
      
      // Check if auto-analyze is enabled
      chrome.storage.sync.get(['autoAnalyze'], (result) => {
        if (result.autoAnalyze !== false) {
          console.log('Auto-analyze enabled, requesting analysis...');
          requestAnalysis();
        } else {
          console.log('Auto-analyze disabled');
        }
      });
    }, CONFIG.WAIT_TIME);
  }
  
  // Run when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Also run when navigation happens (for SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log('URL changed, re-initializing...');
      setTimeout(init, CONFIG.WAIT_TIME);
    }
  }).observe(document, {subtree: true, childList: true});
  
})();
