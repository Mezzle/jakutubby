// Idle chatter, and the replies used when the Claude CLI isn't installed.
// Add your own.
const LINES = [
  "Hehehehe!",
  "Again! Again!",
  "Big hug!",
  "Over the hills and far away…",
  "Time for tea and biscuits?",
  "I'm not sunburnt, I'm just glowing.",
  "Has anyone deployed on a Friday? Hehe.",
  "Have you tried turning the sun off and on again?",
  "I rise at 9 and set at 5:30.",
  "Remember to drink water. Doctor's orders. Well, the sun's orders.",
  "Is it home time yet?",
  "Who moved my cheese? And my stapler?",
  "I've been staring at your screen. Nice code. Hehe.",
  "Bright ideas only, please.",
  "Stand-up? I'm always up.",
  "SPF 50 recommended when looking directly at me.",
];

function randomLine() {
  return LINES[Math.floor(Math.random() * LINES.length)];
}

module.exports = { randomLine };
