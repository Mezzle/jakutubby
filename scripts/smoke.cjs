// Exercise the real Electron window and renderer, without calling Claude.
const { app, BrowserWindow, screen, ipcMain } = require("electron");
const assert = require("node:assert/strict");
const path = require("node:path");
const timeout = setTimeout(() => { console.error("Smoke test timed out"); app.exit(1); }, 30000);
require("../src/main");
app.whenReady().then(async () => {
  try {
    const [window] = BrowserWindow.getAllWindows();
    if (window.webContents.isLoading()) {
      await new Promise(resolve => window.webContents.once("did-finish-load", resolve));
    }
    assert.equal(window.isVisible(), true);
    assert.equal(window.isAlwaysOnTop(), true);
    assert.equal(await window.webContents.executeJavaScript('document.getElementById("sun").naturalWidth > 0'), true);
    await window.webContents.executeJavaScript(`
      window.jakutubby.setFollowing(false);
    `);
    // Put the sun under the real cursor: polling must restore clicks without
    // requiring a mouseenter event from the OS (unsupported on Linux).
    const cursor = screen.getCursorScreenPoint();
    const clickable = new Promise(resolve => {
      const listener = (_event, value) => {
        if (value) { ipcMain.removeListener("set-clickable", listener); resolve(); }
      };
      ipcMain.on("set-clickable", listener);
    });
    console.log("Smoke: testing click-through recovery");
    if (process.platform === "linux") {
      window.setPosition(cursor.x - 160, cursor.y - 60);
    } else {
      // Hosted macOS cursors can sit in the menu bar, above the position to
      // which the OS allows windows to move. Test the same renderer path with
      // fixed coordinates rather than depending on the runner's cursor.
      window.webContents.send("cursor", { x: 160, y: 60, dx: 0, dy: 60 });
    }
    await clickable;
    console.log("Smoke: testing chat");
    window.webContents.send("open-chat");
    await window.webContents.executeJavaScript(`new Promise(resolve => {
      function check() {
        if (!document.getElementById("chat").hidden) resolve();
        else requestAnimationFrame(check);
      }
      check();
    })`);
    // Keep chat open: Escape resumes window movement and can invalidate the
    // compositor surface while capturePage is reading it.
    console.log("Smoke: capturing stationary window");
    await window.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    const image = await window.capturePage();
    assert.equal(image.isEmpty(), false);
    require("node:fs").writeFileSync(path.join(process.cwd(), "smoke.png"), image.toPNG());
    await window.webContents.executeJavaScript('document.getElementById("chat-input").dispatchEvent(new KeyboardEvent("keydown", {key:"Escape"}))');
    assert.equal(await window.webContents.executeJavaScript('document.getElementById("chat").hidden'), true);
    console.log(`Electron smoke passed on ${process.platform}/${process.arch}`);
    clearTimeout(timeout);
    app.quit();
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
