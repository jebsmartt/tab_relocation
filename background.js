// 1. Create the menu item
browser.menus.create({
  id: "move-tab-to-other-window",
  title: "Tab Relocation",
  contexts: ["tab"] // Only shows up when right-clicking a tab
});

// 2. Listen for the click event
browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "move-tab-to-other-window") {
    // Get all normal browser windows
    const windows = await browser.windows.getAll({ windowTypes: ['normal'] });
    
    // Find a window that isn't the one the tab is currently in
    const targetWindow = windows.find(w => w.id !== tab.windowId);

    if (targetWindow) {
      // Move the tab to the end of the other window
      await browser.tabs.move(tab.id, { 
        windowId: targetWindow.id, 
        index: -1 
      });
      
      // Optional: Focus the target window so you see the move happen
      await browser.windows.update(targetWindow.id, { focused: true });
      // Re-select the moved tab to keep it active
      await browser.tabs.update(tab.id, { active: true });
    } else {
      console.log("No other window found to move the tab to.");
    }
  }
});