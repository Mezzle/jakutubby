# Jakutubby

Jakub as the Teletubbies sun, floating along the top of your Windows desktop.
It follows your mouse, says silly things now and then, and passes chat
messages to Claude Code.

## You need

- Windows with [Node.js](https://nodejs.org/) installed.
- Claude Code installed on Windows (`claude` on your `PATH`) if you want real
  answers. Without it the sun still works and replies with silly lines.

## First-time setup

From PowerShell on Windows, in this folder (not WSL, which would download the
Linux build of Electron):

```powershell
npm run setup
```

This also runs Electron's download step by hand, because npm skips it when
`ignore-scripts` is turned on.

## Turning it on and off

- **On:** in PowerShell, in this folder, run `npm start`.
- **Off:** right-click the sun in the system tray (by the clock, possibly
  under the ^ arrow) and choose **Quit**.

## Using it

- Click the sun to open the chat box. Press Enter to send, Escape to close.
- Messages go to `claude -p` and the reply appears in the speech bubble.
  Follow-up messages continue the same Claude session. Claude can't edit files
  or run commands from here.
- If `claude` isn't on your `PATH`, the sun replies with a random line from
  `src/lines.js`.
- Press Ctrl+Alt+J anywhere to make it say one of its lines.
- Right-click the tray icon to make it talk, open the chat, or quit.

## Changing the picture

Run `python3 scripts/cutout.py <photo.png>` (needs Python with Pillow) to
replace `assets/jakub-sun.png`. It keeps the yellow costume and anything
inside it, makes the background transparent and crops to the sun.
