// ============================================================================
// Vitals — Health Index Monitor
// Frontend chat logic. The AI (Gemini, via our backend) runs the whole
// conversation. This file just: renders the chat, calls the backend,
// animates the waveform, and does lightweight pattern-matching on user
// messages so the vital tiles light up live as readings come in.
// ============================================================================

const chatLog = document.getElementById("chat-log");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");
const restartBtn = document.getElementById("restart-btn");

// Conversation history sent to the backend on every turn: [{role, text}]
let history = [];

// ---------------------------------------------------------------------------
// Clinical classification (mirrors the thresholds in the backend system
// prompt, so tile badges are instant + always consistent with the bot's text)
// ---------------------------------------------------------------------------
function classifyBP(systolic, diastolic) {
  if (systolic > 180 || diastolic > 120)
    return { label: "hypertensive crisis", tone: "alert" };
  if (systolic >= 140 || diastolic >= 90)
    return { label: "high (stage 2)", tone: "alert" };
  if (systolic >= 130 || diastolic >= 80)
    return { label: "high (stage 1)", tone: "caution" };
  if (systolic < 90 || diastolic < 60) return { label: "low", tone: "caution" };
  if (systolic >= 120) return { label: "elevated", tone: "caution" };
  return { label: "normal", tone: "normal" };
}

function classifySugar(value) {
  if (value >= 126) return { label: "diabetes range", tone: "alert" };
  if (value >= 100) return { label: "prediabetes", tone: "caution" };
  return { label: "normal", tone: "normal" };
}

function classifyPulse(value) {
  if (value > 100) return { label: "high", tone: "caution" };
  if (value < 60) return { label: "low", tone: "caution" };
  return { label: "normal", tone: "normal" };
}

// ---------------------------------------------------------------------------
// Tile updates
// ---------------------------------------------------------------------------
function setTile(channel, valueText, status) {
  const tile = document.getElementById(`tile-${channel}`);
  const val = document.getElementById(`val-${channel}`);
  const badge = document.getElementById(`badge-${channel}`);

  val.textContent = valueText;
  tile.classList.add("is-filled");

  badge.classList.remove("status--normal", "status--caution", "status--alert");
  if (status) {
    badge.textContent = status.label;
    badge.classList.add(`status--${status.tone}`);
  }
}

// Heuristic: scan a user message for BP / sugar / pulse readings and update
// tiles as soon as a plausible value shows up.
function scanForVitals(text) {
  const lower = text.toLowerCase();

  // Blood pressure: "120/80" style
  const bpMatch = text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (bpMatch) {
    const systolic = parseInt(bpMatch[1], 10);
    const diastolic = parseInt(bpMatch[2], 10);
    setTile("bp", `${systolic}/${diastolic}`, classifyBP(systolic, diastolic));
    return;
  }

  // Blood sugar: needs a nearby keyword since it's just a number otherwise
  const sugarKeyword = /(sugar|glucose|mg\s*\/?\s*dl)/.test(lower);
  const numberMatch = text.match(/\d{2,3}/);
  if (sugarKeyword && numberMatch) {
    const value = parseInt(numberMatch[0], 10);
    setTile("sugar", `${value}`, classifySugar(value));
    return;
  }

  // Pulse: needs a nearby keyword too
  const pulseKeyword = /(pulse|bpm|heart rate|heartbeat)/.test(lower);
  if (pulseKeyword && numberMatch) {
    const value = parseInt(numberMatch[0], 10);
    setTile("pulse", `${value}`, classifyPulse(value));
    return;
  }

  // Bare number with no keyword: fall back to whichever tile is still empty,
  // preferring sugar then pulse (BP needs the slash format above).
  if (numberMatch && !bpMatch) {
    const value = parseInt(numberMatch[0], 10);
    const sugarTile = document.getElementById("tile-sugar");
    const pulseTile = document.getElementById("tile-pulse");
    if (!sugarTile.classList.contains("is-filled")) {
      setTile("sugar", `${value}`, classifySugar(value));
    } else if (!pulseTile.classList.contains("is-filled")) {
      setTile("pulse", `${value}`, classifyPulse(value));
    }
  }
}

// ---------------------------------------------------------------------------
// Chat rendering
// ---------------------------------------------------------------------------
function appendMessage(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `msg ${role === "user" ? "msg--user" : "msg--bot"}`;
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
  return bubble;
}

function showTyping() {
  const typing = document.createElement("div");
  typing.className = "msg--typing";
  typing.id = "typing-indicator";
  typing.innerHTML = "<span></span><span></span><span></span>";
  chatLog.appendChild(typing);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function hideTyping() {
  const typing = document.getElementById("typing-indicator");
  if (typing) typing.remove();
}

// ---------------------------------------------------------------------------
// Backend call
// ---------------------------------------------------------------------------
async function sendToBackend() {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history }),
    });

    const data = await response.json();
    hideTyping();

    if (!response.ok) {
      appendMessage(
        "assistant",
        `⚠ ${data.error || "Something went wrong reaching the AI."}`
      );
      return;
    }

    history.push({ role: "assistant", text: data.reply });
    appendMessage("assistant", data.reply);
  } catch (err) {
    hideTyping();
    appendMessage(
      "assistant",
      "⚠ Couldn't reach the server. Is the backend running?"
    );
  }
}

// ---------------------------------------------------------------------------
// Form handling
// ---------------------------------------------------------------------------
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage("user", text);
  scanForVitals(text);
  history.push({ role: "user", text });
  chatInput.value = "";
  chatSend.disabled = true;
  showTyping();

  sendToBackend().finally(() => {
    chatSend.disabled = false;
    chatInput.focus();
  });
});

restartBtn.addEventListener("click", () => {
  history = [];
  chatLog.innerHTML = "";
  ["bp", "sugar", "pulse"].forEach((ch) => {
    const tile = document.getElementById(`tile-${ch}`);
    tile.classList.remove("is-filled");
    const badge = document.getElementById(`badge-${ch}`);
    badge.classList.remove(
      "status--normal",
      "status--caution",
      "status--alert"
    );
    badge.textContent = "awaiting reading";
  });
  document.getElementById("val-bp").textContent = "--/--";
  document.getElementById("val-sugar").textContent = "--";
  document.getElementById("val-pulse").textContent = "--";
  startConversation();
});

// Kick off the conversation on load by asking the bot for its opening line.
// We send a hidden "kickoff" user turn instead of an empty history, since
// Gemini rejects a request with no content at all.
function startConversation() {
  history.push({
    role: "user",
    text: "Hello, I'm ready to start my health check-in.",
  });
  showTyping();
  sendToBackend();
}

// ---------------------------------------------------------------------------
// Waveform animation (signature element) — a looping ECG-style trace drawn
// with requestAnimationFrame, scrolling continuously across the strip.
// ---------------------------------------------------------------------------
(function animateWaveform() {
  const path = document.getElementById("wave-path");
  const width = 1200;
  const height = 100;
  const midline = height / 2;

  // Build one ECG-like cycle: flat line, small bump, sharp QRS spike, small
  // bump, flat line. Repeated across the width so it can scroll seamlessly.
  function buildCycle(startX) {
    const w = 160; // width of one heartbeat cycle
    const m = midline;
    return `M ${startX} ${m}
      L ${startX + w * 0.15} ${m}
      L ${startX + w * 0.22} ${m - 6}
      L ${startX + w * 0.28} ${m}
      L ${startX + w * 0.36} ${m}
      L ${startX + w * 0.4} ${m + 18}
      L ${startX + w * 0.44} ${m - 38}
      L ${startX + w * 0.48} ${m + 10}
      L ${startX + w * 0.52} ${m}
      L ${startX + w * 0.62} ${m}
      L ${startX + w * 0.7} ${m - 10}
      L ${startX + w * 0.78} ${m}
      L ${startX + w} ${m}`;
  }

  let offset = 0;
  const cycleWidth = 160;
  const totalCycles = Math.ceil(width / cycleWidth) + 2;

  function render() {
    let d = "";
    for (let i = 0; i < totalCycles; i++) {
      const x = i * cycleWidth - offset;
      d += buildCycle(x) + " ";
    }
    path.setAttribute("d", d);
    offset += 1.5;
    if (offset > cycleWidth) offset -= cycleWidth;
    requestAnimationFrame(render);
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    path.setAttribute(
      "d",
      buildCycle(0).repeat ? buildCycle(0) : buildCycle(0)
    );
  } else {
    render();
  }
})();

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
startConversation();
