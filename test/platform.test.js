const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const { EventEmitter } = require("node:events");

for (const platform of ["linux", "darwin", "win32"]) {
  test(`${platform}: window setup and cursor recovery while click-through`, async () => {
    const calls = [];
    let menu;
    const ipcMain = new EventEmitter();
    ipcMain.handle = () => {};
    class Window extends EventEmitter {
      constructor(options) { super(); this.options = options; Window.instance = this; }
      webContents = { send: (...args) => calls.push(args) };
      show() { calls.push(["show"]); }
      focus() { calls.push(["focus"]); }
      setAlwaysOnTop() {}
      setVisibleOnAllWorkspaces(...args) { calls.push(["workspaces", ...args]); }
      setIgnoreMouseEvents(...args) { calls.push(["ignore", ...args]); }
      loadFile() {}
      isDestroyed() { return false; }
      getPosition() { return [100, 4]; }
      setPosition() {}
    }
    const app = new EventEmitter();
    Object.assign(app, {
      commandLine: { appendSwitch: (...args) => calls.push(["switch", ...args]) },
      requestSingleInstanceLock: () => true,
      whenReady: () => Promise.resolve(),
      dock: { hide: () => calls.push(["hide-dock"]) },
    });
    const electron = {
      app, BrowserWindow: Window, ipcMain,
      globalShortcut: { register: () => true },
      screen: {
        getPrimaryDisplay: () => ({ workArea: { x: 0, y: 0, width: 1200 } }),
        getDisplayNearestPoint: () => ({ workArea: { x: 0, y: 0, width: 1200 } }),
        getCursorScreenPoint: () => ({ x: 200, y: 40 }),
      },
      Tray: class { setToolTip() {} setContextMenu() {} },
      Menu: { buildFromTemplate: template => { menu = template; return { popup: () => calls.push(["popup"]) }; } },
      nativeImage: { createFromPath: () => ({ resize: () => ({}) }) },
    };
    let tick;
    vm.runInNewContext(fs.readFileSync("src/main.js", "utf8"), {
      require: id => id === "electron" ? electron : id.startsWith("./") ? {} : require(id),
      process: { platform }, __dirname: require("node:path").resolve("src"),
      setInterval: fn => { tick = fn; }, clearInterval() {}, console,
    });
    await Promise.resolve();
    menu.find(item => item.label === "Chat").click();
    assert.deepEqual(calls.slice(-3).map(call => call[0]), ["show", "focus", "open-chat"]);
    ipcMain.emit("open-menu", {});
    assert.equal(calls.at(-1)[0], "popup");
    ipcMain.emit("set-following", {}, false);
    tick();
    const cursor = calls.find(call => call[0] === "cursor")[1];
    assert.equal(cursor.x, 100);
    assert.equal(cursor.y, 36);
    // Linux must receive cursor updates even when the window ignores input.
    ipcMain.emit("set-clickable", {}, true);
    assert.equal(calls.at(-1)[1], false);
    assert.equal(Window.instance.options.webPreferences.backgroundThrottling, false);
    assert.equal(calls.some(call => call[0] === "switch" && call[2] === "x11"), platform === "linux");
    assert.equal(calls.some(call => call[0] === "workspaces" && call[2].visibleOnFullScreen), platform === "darwin");
  });
}

test("renderer recovers clickability from cursor polling without mouse events", () => {
  const elements = Object.fromEntries(["sun", "sun-lean", "bubble", "bubble-text", "bubble-close", "chat", "chat-input"].map(id => [id, {
    hidden: true, style: {}, addEventListener() {}, classList: { add() {}, remove() {} },
  }]));
  let onCursor;
  let hit;
  const clickable = [];
  vm.runInNewContext(fs.readFileSync("src/renderer/renderer.js", "utf8"), {
    document: {
      getElementById: id => elements[id], addEventListener() {},
      querySelectorAll: () => Object.values(elements),
      elementFromPoint: () => hit,
    },
    window: { jakutubby: {
      onCursor: fn => { onCursor = fn; }, setClickable: value => clickable.push(value),
      onOpenChat() {}, onSaySomething() {},
    } },
    setTimeout() {}, Math,
  });
  onCursor({ dx: 0, x: -1, y: -1 });
  assert.equal(clickable.at(-1), false);
  hit = { closest: selector => selector === ".interactive" ? elements.sun : null };
  onCursor({ dx: 60, x: 150, y: 40 });
  assert.equal(clickable.at(-1), true);
  assert.equal(elements["sun-lean"].style.transform, "rotate(2deg)");
  hit = null;
  onCursor({ dx: 0, x: 310, y: 410 });
  assert.equal(clickable.at(-1), false);
});
