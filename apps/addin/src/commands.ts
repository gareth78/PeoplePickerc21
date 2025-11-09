declare global {
  interface Window {
    showTaskPane?: (event: Office.AddinCommands.Event) => void;
  }
}

const showTaskPane = async (event?: Office.AddinCommands.Event) => {
  try {
    await Office.addin.showAsTaskpane();
  } catch (error) {
    console.error('[addin] Failed to open task pane', error);
  } finally {
    event?.completed?.();
  }
};

let hasRegistered = false;

const registerShowTaskPane = () => {
  if (hasRegistered) {
    return;
  }

  const handler = (event: Office.AddinCommands.Event) => {
    void showTaskPane(event);
  };

  window.showTaskPane = handler;

  if (Office.actions?.associate) {
    Office.actions.associate('showTaskPane', handler);
  } else {
    console.warn('[addin] Office.actions.associate unavailable; using legacy command handler.');
  }

  hasRegistered = true;
};

const ensureOfficeReady = () => {
  if (typeof Office === 'undefined') {
    console.error('[addin] Office.js failed to load.');
    return;
  }

  const originalInitialize = Office.initialize;

  Office.initialize = (reason) => {
    registerShowTaskPane();
    if (typeof originalInitialize === 'function') {
      originalInitialize(reason);
    }
  };

  if (Office.onReady) {
    Office.onReady()
      .then(registerShowTaskPane)
      .catch((error) => {
        console.error('[addin] Office.onReady failed', error);
        registerShowTaskPane();
      });
  } else {
    registerShowTaskPane();
  }
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  ensureOfficeReady();
} else {
  window.addEventListener('load', ensureOfficeReady);
}

export {};
