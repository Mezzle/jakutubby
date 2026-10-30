const { spawn } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");
const { randomLine } = require("./lines");

const CLAUDE_TIMEOUT_MS = 3 * 60 * 1000;
const PERSONA = [
  "You are Jakutubby: our colleague Jakub, dressed as the",
  "Teletubbies baby sun. You live on a colleague's desktop and reply in a small",
  "speech bubble, so keep answers short (a few sentences at most) unless asked",
  "for more. Be cheerful, giggle now and then, and use British English.",
].join(" ");

// Remembered so follow-up messages continue the same Claude conversation.
let sessionId;

function askClaude(message) {
  const args = ["-p", message, "--output-format", "json", "--append-system-prompt", PERSONA];
  if (sessionId) args.push("--resume", sessionId);

  return new Promise((resolve) => {
    // stdin must be closed: with an open pipe, claude -p waits for piped input
    // and never answers.
    const child = spawn("claude", args, {
      cwd: os.homedir(),
      // Desktop launches may omit the native Claude installer and Homebrew.
      env: {
        ...process.env,
        PATH: [process.env.PATH, path.join(os.homedir(), ".local", "bin"),
          "/opt/homebrew/bin", "/usr/local/bin"].filter(Boolean).join(path.delimiter),
      },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: CLAUDE_TIMEOUT_MS,
      windowsHide: true,
    });

    let stdout = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));

    child.on("error", (error) => {
      const reason = error.code === "ENOENT" ? "" : "Something went wrong. Uh-oh! ";
      resolve({ text: reason + randomLine(), fromClaude: false });
    });

    child.on("close", () => {
      try {
        const result = JSON.parse(stdout);
        sessionId = result.session_id ?? sessionId;
        resolve({ text: result.result || "Hehe… I've got nothing.", fromClaude: true });
      } catch {
        const reason = child.killed ? "I took too long and fell asleep" : "Something went wrong";
        resolve({ text: `${reason}. Uh-oh! ${randomLine()}`, fromClaude: false });
      }
    });
  });
}

module.exports = { askClaude };
