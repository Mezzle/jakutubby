const { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, nativeImage } = require("electron");
const path = require("node:path");
const { askClaude } = require("./claude");
const { randomLine } = require("./lines");

const WINDOW_WIDTH = 320;
const WINDOW_HEIGHT = 420;
const TOP_MARGIN = 4;
const FRAME_MS = 16;
const FOLLOW_EASING = 0.04;
// Distance kept between the cursor and the sun's centre, so the sun hovers
// beside the pointer instead of covering whatever you're about to click.
const FOLLOW_OFFSET = 130;
const SAY_SOMETHING_SHORTCUT = "CommandOrControl+Alt+J";

// Native Wayland does not support the global cursor/positioning APIs used here.
// XWayland preserves the same desktop behaviour as an X11 session.
if (process.platform === "linux") app.commandLine.appendSwitch("ozone-platform", "x11");

let sunWindow;
let tray;
let contextMenu;
let isFollowing = true;
let isPointerOverSun = false;

function createSunWindow() {
  const { workArea } = screen.getPrimaryDisplay();

  sunWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: Math.round(workArea.x + (workArea.width - WINDOW_WIDTH) / 2),
    y: workArea.y + TOP_MARGIN,
    transparent: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: {
      backgroundThrottling: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // "screen-saver" keeps the sun above full-screen windows and the taskbar.
  sunWindow.setAlwaysOnTop(true, "screen-saver");
  if (process.platform === "darwin") {
    sunWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    app.dock.hide();
  }
  // Clicks pass through the transparent parts until the renderer says the
  // pointer is over the sun, the bubble or the text box.
  sunWindow.setIgnoreMouseEvents(true, { forward: true });
  sunWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  const followTimer = setInterval(followCursor, FRAME_MS);
  sunWindow.on("closed", () => clearInterval(followTimer));
}

// Drift sideways towards the mouse along the top of the screen, and tell the
// renderer where the mouse is so the sun can lean towards it.
function followCursor() {
  if (!sunWindow || sunWindow.isDestroyed()) return;

  const cursor = screen.getCursorScreenPoint();
  const [windowX, windowY] = sunWindow.getPosition();
  const sunCentreX = windowX + WINDOW_WIDTH / 2;

  if (isFollowing && !isPointerOverSun) {
    const { workArea } = screen.getDisplayNearestPoint(cursor);
    const minX = workArea.x;
    const maxX = workArea.x + workArea.width - WINDOW_WIDTH;
    const side = sunCentreX >= cursor.x ? 1 : -1;
    const targetCentreX = cursor.x + side * FOLLOW_OFFSET;
    const targetX = Math.min(maxX, Math.max(minX, targetCentreX - WINDOW_WIDTH / 2));
    const nextX = Math.round(windowX + (targetX - windowX) * FOLLOW_EASING);

    if (nextX !== windowX || windowY !== workArea.y + TOP_MARGIN) {
      sunWindow.setPosition(nextX, workArea.y + TOP_MARGIN);
    }
  }

  const [currentX, currentY] = sunWindow.getPosition();
  sunWindow.webContents.send("cursor", {
    x: cursor.x - currentX,
    y: cursor.y - currentY,
    dx: cursor.x - sunCentreX,
    dy: cursor.y - windowY,
  });
}

function saySomething() {
  sunWindow.webContents.send("say-something");
}

function openChat() {
  sunWindow.show();
  sunWindow.focus();
  sunWindow.webContents.send("open-chat");
}

function createTray() {
  const icon = nativeImage
    .createFromPath(path.join(__dirname, "..", "assets", "jakub-sun.png"))
    .resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip("Jakutubby");
  contextMenu = Menu.buildFromTemplate([
    { label: "Say something", accelerator: SAY_SOMETHING_SHORTCUT, click: saySomething },
    { label: "Chat", click: openChat },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);
  tray.setContextMenu(contextMenu);
}

ipcMain.on("open-menu", () => contextMenu.popup({ window: sunWindow }));

ipcMain.on("set-clickable", (_event, isClickable) => {
  if (isPointerOverSun === isClickable) return;
  isPointerOverSun = isClickable;
  sunWindow.setIgnoreMouseEvents(!isClickable, { forward: true });
});

ipcMain.on("set-following", (_event, shouldFollow) => {
  isFollowing = shouldFollow;
});

ipcMain.handle("ask-claude", (_event, message) => askClaude(message));
ipcMain.handle("random-line", () => randomLine());

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    createSunWindow();
    createTray();
    if (!globalShortcut.register(SAY_SOMETHING_SHORTCUT, saySomething)) {
      console.warn("Jakutubby: global shortcut unavailable; use the tray menu instead.");
    }
  });

  app.on("will-quit", () => globalShortcut.unregisterAll());
}
