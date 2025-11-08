const showTaskPane = async (event?: Office.AddinCommands.Event) => {
  try {
    await Office.addin.showAsTaskpane();
  } catch (error) {
    console.error('[addin] Failed to open task pane', error);
  } finally {
    event?.completed?.();
  }
};

if (typeof Office !== 'undefined' && Office.actions?.associate) {
  Office.actions.associate('showTaskPane', (event) => {
    void showTaskPane(event);
  });
}

export {};
