# Jakutubby

Jakub as the Teletubbies sun, floating along the top of your Windows, Linux or macOS desktop.
It follows your mouse, says silly things now and then, and passes chat
messages to Claude Code.

## You need

- Windows, macOS, or a Linux desktop with [Node.js](https://nodejs.org/) installed.
- On Linux, an X11 session or XWayland (including on Wayland desktops). Native
  Wayland cannot provide the global cursor tracking and window positioning the
  sun needs, so Jakutubby selects Electron's X11 backend. A graphical session
  and Electron's system libraries are required; headless servers are unsupported.
- On GNOME, a tray/AppIndicator extension is optional: right-click the sun
  itself to access the menu if your desktop does not show tray icons.
- Claude Code installed on your OS (`claude` on your `PATH`) if you want real
  answers. Without it the sun still works and replies with silly lines.

## First-time setup

In this folder, use PowerShell on Windows or Terminal on macOS/Linux.
Run setup separately on each OS; do not copy `node_modules` between platforms.
For the Windows desktop, use Windows rather than WSL.

```sh
npm run setup
```

This also runs Electron's download step by hand, because npm skips it when
`ignore-scripts` is turned on.

## Turning it on and off

- **On:** in a terminal, in this folder, run `npm start`.
- **Off:** right-click the sun itself or its tray/menu-bar icon and choose **Quit**.
  On macOS the app lives in the menu bar, with no Dock icon.

## Using it

- Click the sun to open the chat box. Press Enter to send, Escape to close.
- Messages go to `claude -p` and the reply appears in the speech bubble.
  Follow-up messages continue the same Claude session. Claude can't edit files
  or run commands from here.
- If `claude` isn't on your `PATH`, the sun replies with a random line from
  `src/lines.js`.
- Press Ctrl+Alt+J (Option+Command+J on macOS) anywhere to make it say one of its lines.
- If another app owns the shortcut, use the sun or tray menu instead.
- Right-click the sun or tray icon to make it talk, open the chat, or quit.

## Changing the picture

Run `python3 scripts/cutout.py <photo.png>` (needs Python with Pillow) to
replace `assets/jakub-sun.png`. It keeps the yellow costume and anything
inside it, makes the background transparent and crops to the sun.

## Development checks

Run `npm test` for platform regression tests and `npm run test:smoke` in a
graphical desktop session for a real Electron window/renderer check. On Linux
CI, use `xvfb-run --auto-servernum npm run test:smoke`. The smoke check saves
`smoke.png`; GitHub Actions runs it on Linux, macOS and Windows.
