// Truncate long window titles for submenu labels
function truncate(str, maxLen = 50) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "\u2026" : str;
}

// Move a tab to a target window and focus it
async function moveTabToWindow(tab, targetWindowId) {
  await browser.tabs.move(tab.id, { windowId: targetWindowId, index: -1 });
  await browser.windows.update(targetWindowId, { focused: true });
  await browser.tabs.update(tab.id, { active: true });
}

// Dynamically rebuild the context menu just before it is shown on a tab
browser.menus.onShown.addListener(async (info, tab) => {
  if (!info.contexts.includes("tab")) return;

  // Clear any previously built items so we start fresh
  await browser.menus.removeAll();

  const windows = await browser.windows.getAll({ windowTypes: ["normal"], populate: true });
  const otherWindows = windows.filter(w => w.id !== tab.windowId);

  if (otherWindows.length === 1) {
    // Exactly two windows — single top-level item
    browser.menus.create({
      id: "move-tab-to-other-window",
      title: "Tab Relocation",
      contexts: ["tab"]
    });
  } else if (otherWindows.length > 1) {
    // Three or more windows — parent item with one child per destination window
    browser.menus.create({
      id: "move-tab-parent",
      title: "Tab Relocation",
      contexts: ["tab"]
    });

    for (const win of otherWindows) {
      const activeTab = win.tabs.find(t => t.active);
      const label = activeTab ? truncate(activeTab.title) : `Window ${win.id}`;
      browser.menus.create({
        id: `move-tab-to-window-${win.id}`,
        parentId: "move-tab-parent",
        title: label,
        contexts: ["tab"]
      });
    }
  }
  // If otherWindows.length === 0 (only one window), no item is added

  browser.menus.refresh();
});

// Handle clicks for both the single-item and submenu cases
browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "move-tab-to-other-window") {
    // Two-window case: move to the one other window
    const windows = await browser.windows.getAll({ windowTypes: ["normal"] });
    const targetWindow = windows.find(w => w.id !== tab.windowId);
    if (targetWindow) {
      await moveTabToWindow(tab, targetWindow.id);
    }
  } else if (typeof info.menuItemId === "string" && info.menuItemId.startsWith("move-tab-to-window-")) {
    // Submenu case: parse the target window ID from the menu item ID
    const targetWindowId = parseInt(info.menuItemId.slice("move-tab-to-window-".length), 10);
    await moveTabToWindow(tab, targetWindowId);
  }
});