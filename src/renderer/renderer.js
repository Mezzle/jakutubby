const sun = document.getElementById("sun");
const sunLean = document.getElementById("sun-lean");
const bubble = document.getElementById("bubble");
const bubbleText = document.getElementById("bubble-text");
const bubbleClose = document.getElementById("bubble-close");
const chat = document.getElementById("chat");
const chatInput = document.getElementById("chat-input");

const MAX_LEAN_DEGREES = 18;
const LEAN_DISTANCE_PER_DEGREE = 30;
const IDLE_CHATTER_MIN_MS = 60 * 1000;
const IDLE_CHATTER_MAX_MS = 120 * 1000;
const IDLE_BUBBLE_MS = 6 * 1000;

let isWaitingForClaude = false;
let idleBubbleTimer;

// Polling works even when Linux stops delivering mouse events to an ignored
// window. DOM hit testing also includes the sun's animation and hidden panels.
window.jakutubby.onCursor(({ dx, x, y }) => {
  const isClickable = Boolean(document.elementFromPoint(x, y)?.closest(".interactive"));
  window.jakutubby.setClickable(isClickable);
  const lean = Math.max(-MAX_LEAN_DEGREES, Math.min(MAX_LEAN_DEGREES, dx / LEAN_DISTANCE_PER_DEGREE));
  sunLean.style.transform = `rotate(${lean}deg)`;
});

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  window.jakutubby.openMenu();
});

sun.addEventListener("mouseenter", giggle);
sun.addEventListener("click", () => (chat.hidden ? openChat() : closeChat()));
bubbleClose.addEventListener("click", closeChat);
window.jakutubby.onOpenChat(openChat);
window.jakutubby.onSaySomething(sayRandomLine);

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeChat();
});

chat.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message || isWaitingForClaude) return;

  chatInput.value = "";
  isWaitingForClaude = true;
  showBubble("Thinking", { isThinking: true });

  const reply = await window.jakutubby.askClaude(message);

  isWaitingForClaude = false;
  showBubble(reply.text);
  giggle();
});

function openChat() {
  window.jakutubby.setFollowing(false);
  chat.hidden = false;
  chatInput.focus();
}

// Hides the chat box and bubble and lets the sun wander again.
function closeChat() {
  chat.hidden = true;
  bubble.hidden = true;
  window.jakutubby.setClickable(false);
  window.jakutubby.setFollowing(true);
}

function showBubble(text, { isThinking = false } = {}) {
  clearTimeout(idleBubbleTimer);
  bubbleText.textContent = text;
  bubbleText.classList.toggle("thinking", isThinking);
  bubbleText.scrollTop = 0;
  bubble.hidden = false;
}

async function sayRandomLine() {
  if (!chat.hidden) return;

  showBubble(await window.jakutubby.randomLine());
  giggle();
  idleBubbleTimer = setTimeout(hideIdleBubble, IDLE_BUBBLE_MS);
}

// A hidden element never fires mouseleave, so release the pointer here too.
function hideIdleBubble() {
  bubble.hidden = true;
  if (sun.matches(":hover")) return;
  window.jakutubby.setClickable(false);
}

function giggle() {
  sun.classList.remove("giggle");
  // Reading offsetWidth forces a reflow so the animation restarts.
  void sun.offsetWidth;
  sun.classList.add("giggle");
}

function scheduleIdleChatter() {
  const delay = IDLE_CHATTER_MIN_MS + Math.random() * (IDLE_CHATTER_MAX_MS - IDLE_CHATTER_MIN_MS);
  setTimeout(async () => {
    await sayRandomLine();
    scheduleIdleChatter();
  }, delay);
}

scheduleIdleChatter();
setTimeout(sayRandomLine, 1500);
