/*!
 * BIRC chat pop-up widget.
 * Usage:  <script src="https://<backend>/widget.js" data-api="https://<backend>" defer></script>
 * Self-contained: renders inside a Shadow DOM so site CSS can't leak in (or out).
 */
(function () {
  "use strict";
  if (window.__bircChatLoaded) return;
  window.__bircChatLoaded = true;

  var script = document.currentScript || document.querySelector("script[data-api][src*='widget.js']");
  var API = ((script && script.getAttribute("data-api")) || "").replace(/\/+$/, "");
  if (!API && script && script.src) API = new URL(script.src).origin;
  var TITLE = (script && script.getAttribute("data-title")) || "Ask BIRC";
  var STORE_KEY = "birc-chat-v1";
  var SUGGESTIONS = [
    "How do I access my data on the file server?",
    "What are the storage rules for the file server?",
    "How do I use BIRC workstations remotely?",
    "How should I acknowledge BIRC in my paper?",
  ];

  // ------------------------------------------------------------------ state
  var state = { open: false, messages: [] };
  try {
    var saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || "null");
    if (saved && Array.isArray(saved.messages)) state = saved;
  } catch (e) {}
  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  // Random, anonymous ID that groups the turns of one conversation in the log.
  function newConversationId() { return Math.random().toString(36).slice(2, 10); }
  if (!state.cid) state.cid = newConversationId();
  var busy = false;

  // ------------------------------------------------------------------ helpers
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Minimal Markdown: escape everything first, then add a safe subset of formatting.
  function inline(s) {
    var codes = [];
    s = s.replace(/`([^`]+)`/g, function (_, c) { codes.push(c); return "\u0000" + (codes.length - 1) + "\u0000"; });
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:!?'"])/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>");
    s = s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return "<code>" + esc(codes[+i]) + "</code>"; });
    return s;
  }
  function md(src) {
    var lines = src.replace(/\r/g, "").split("\n");
    var html = "", list = null, para = [], inCode = false, code = [];
    function flushPara() { if (para.length) { html += "<p>" + para.map(inline).join("<br>") + "</p>"; para = []; } }
    function closeList() { if (list) { html += "</" + list + ">"; list = null; } }
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i], m;
      if (/^\s*```/.test(l)) {
        if (inCode) { html += "<pre><code>" + esc(code.join("\n")) + "</code></pre>"; code = []; inCode = false; }
        else { flushPara(); closeList(); inCode = true; }
        continue;
      }
      if (inCode) { code.push(l); continue; }
      if ((m = l.match(/^\s*[-*•]\s+(.*)/))) {
        flushPara(); if (list !== "ul") { closeList(); html += "<ul>"; list = "ul"; }
        html += "<li>" + inline(m[1]) + "</li>";
      } else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) {
        flushPara(); if (list !== "ol") { closeList(); html += "<ol>"; list = "ol"; }
        html += "<li>" + inline(m[1]) + "</li>";
      } else if ((m = l.match(/^#{1,6}\s+(.*)/))) {
        flushPara(); closeList(); html += "<h4>" + inline(m[1]) + "</h4>";
      } else if (/^\s*$/.test(l)) {
        flushPara(); closeList();
      } else {
        closeList(); para.push(l);
      }
    }
    if (inCode) html += "<pre><code>" + esc(code.join("\n")) + "</code></pre>";
    flushPara(); closeList();
    return html;
  }

  // ------------------------------------------------------------------ DOM
  var host = document.createElement("div");
  host.id = "birc-chat-host";
  host.style.cssText = "position:fixed;z-index:2147483000;right:0;bottom:0;width:0;height:0;";
  var root = host.attachShadow({ mode: "open" });

  var CSS = [
    ":host { all: initial; }",
    "* { box-sizing: border-box; }",
    ".wrap { --bg:#fff; --fg:#212529; --muted:#6c757d; --border:#dee2e6; --accent:#2c3e50; --accent-fg:#fff;",
    "  --user:#2c3e50; --user-fg:#fff; --bot:#f1f3f5; --code:#e9ecef; --link:#128f76;",
    "  font-family: system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;",
    "  font-size:14.5px; line-height:1.45; color:var(--fg); }",
    ".wrap.dark { --bg:#222; --fg:#e9ecef; --muted:#adb5bd; --border:#444; --accent:#375a7f; --user:#375a7f;",
    "  --bot:#303030; --code:#3a3a3a; --link:#00bc8c; }",
    ".fab { position:fixed; right:22px; bottom:22px; width:58px; height:58px; border-radius:50%; border:none;",
    "  cursor:pointer; background:var(--accent); color:var(--accent-fg); box-shadow:0 6px 18px rgba(0,0,0,.25);",
    "  display:flex; align-items:center; justify-content:center; transition:transform .15s ease; }",
    ".fab:hover { transform:scale(1.06); }",
    ".fab:focus-visible { outline:3px solid var(--link); outline-offset:3px; }",
    ".fab svg { width:28px; height:28px; }",
    ".panel { position:fixed; right:22px; bottom:92px; width:380px; height:min(580px, calc(100vh - 120px));",
    "  background:var(--bg); border:1px solid var(--border); border-radius:14px; box-shadow:0 12px 40px rgba(0,0,0,.28);",
    "  display:none; flex-direction:column; overflow:hidden; }",
    ".panel.open { display:flex; animation:pop .16s ease-out; }",
    "@keyframes pop { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }",
    ".head { background:var(--accent); color:var(--accent-fg); padding:12px 14px; display:flex; align-items:center; gap:8px; }",
    ".head .t { font-weight:600; font-size:15.5px; flex:1; }",
    ".head .s { font-size:12px; opacity:.8; font-weight:400; display:block; }",
    ".icon-btn { background:transparent; border:none; color:inherit; cursor:pointer; padding:4px 7px; border-radius:6px; font-size:13px; opacity:.85; }",
    ".icon-btn:hover { opacity:1; background:rgba(255,255,255,.15); }",
    ".log { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; }",
    ".msg { max-width:88%; padding:9px 12px; border-radius:12px; overflow-wrap:anywhere; }",
    ".msg.user { align-self:flex-end; background:var(--user); color:var(--user-fg); border-bottom-right-radius:4px; white-space:pre-wrap; }",
    ".msg.bot { align-self:flex-start; background:var(--bot); border-bottom-left-radius:4px; }",
    ".msg.err { align-self:flex-start; background:#f8d7da; color:#842029; }",
    ".msg.bot p { margin:0 0 .5em; } .msg.bot p:last-child { margin-bottom:0; }",
    ".msg.bot ul, .msg.bot ol { margin:.2em 0 .5em; padding-left:1.3em; }",
    ".msg.bot li { margin:.15em 0; }",
    ".msg.bot h4 { margin:.4em 0 .3em; font-size:1em; }",
    ".msg.bot code { background:var(--code); padding:1px 4px; border-radius:4px; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:.9em; }",
    ".msg.bot pre { background:var(--code); padding:8px; border-radius:6px; overflow-x:auto; margin:.3em 0 .5em; }",
    ".msg.bot pre code { background:none; padding:0; }",
    ".msg.bot a { color:var(--link); }",
    ".msg.bot em { color:var(--muted); }",
    ".status { color:var(--muted); font-size:13px; font-style:italic; align-self:flex-start; }",
    ".dots span { display:inline-block; width:6px; height:6px; margin-right:3px; border-radius:50%; background:var(--muted); animation:b 1.2s infinite; }",
    ".dots span:nth-child(2) { animation-delay:.2s; } .dots span:nth-child(3) { animation-delay:.4s; }",
    "@keyframes b { 0%,80%,100% { opacity:.25; } 40% { opacity:1; } }",
    ".intro { color:var(--muted); font-size:13.5px; }",
    ".chips { display:flex; flex-direction:column; gap:6px; margin-top:8px; }",
    ".chip { text-align:left; background:transparent; border:1px solid var(--border); color:var(--fg); border-radius:10px;",
    "  padding:7px 10px; cursor:pointer; font:inherit; font-size:13.5px; }",
    ".chip:hover { border-color:var(--link); }",
    "form { display:flex; gap:8px; padding:10px; border-top:1px solid var(--border); background:var(--bg); margin:0; }",
    "textarea { flex:1; resize:none; border:1px solid var(--border); border-radius:10px; padding:8px 10px; font:inherit;",
    "  color:var(--fg); background:var(--bg); max-height:120px; min-height:40px; overflow-y:auto; scrollbar-width:thin; }",
    "textarea:focus { outline:none; border-color:var(--link); }",
    ".send { border:none; border-radius:10px; background:var(--accent); color:var(--accent-fg); padding:0 14px; cursor:pointer; font:inherit; font-weight:600; }",
    ".send:disabled { opacity:.5; cursor:default; }",
    ".foot { font-size:11px; color:var(--muted); text-align:center; padding:0 10px 8px; background:var(--bg); }",
    "@media (max-width:480px) {",
    "  .panel { right:0; bottom:0; width:100vw; height:100dvh; border-radius:0; border:none; }",
    "  .panel.open ~ .fab { display:none; }",
    "}",
  ].join("\n");

  root.innerHTML =
    "<style>" + CSS + "</style>" +
    '<div class="wrap">' +
    '<div class="panel" role="dialog" aria-label="' + esc(TITLE) + '">' +
    '<div class="head">' +
    '<div class="t">' + esc(TITLE) + '<span class="s">Answers from BIRC facility documents</span></div>' +
    '<button class="icon-btn clear" type="button" title="Start a new conversation" aria-label="New conversation">New chat</button>' +
    '<button class="icon-btn close" type="button" title="Close" aria-label="Close chat">&#x2715;</button>' +
    "</div>" +
    '<div class="log" aria-live="polite"></div>' +
    '<form><textarea rows="1" placeholder="Ask a question…" aria-label="Your question"></textarea>' +
    '<button class="send" type="submit">Send</button></form>' +
    '<div class="foot">AI assistant — may make mistakes. Check important details with BIRC staff. Questions are logged to improve this service.</div>' +
    "</div>" +
    '<button class="fab" type="button" aria-expanded="false" aria-label="Open ' + esc(TITLE) + ' chat" title="' + esc(TITLE) + '">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
    "</button>" +
    "</div>";

  var wrap = root.querySelector(".wrap");
  var panel = root.querySelector(".panel");
  var fab = root.querySelector(".fab");
  var log = root.querySelector(".log");
  var form = root.querySelector("form");
  var input = root.querySelector("textarea");
  var sendBtn = root.querySelector(".send");

  // Quarto marks the body with quarto-dark / quarto-light.
  function syncTheme() {
    wrap.classList.toggle("dark", !!(document.body && document.body.classList.contains("quarto-dark")));
  }

  // ------------------------------------------------------------------ rendering
  function bubble(role, text) {
    var d = document.createElement("div");
    d.className = "msg " + (role === "user" ? "user" : role === "error" ? "err" : "bot");
    if (role === "assistant") d.innerHTML = md(text); else d.textContent = text;
    log.appendChild(d);
    return d;
  }
  function scrollDown() { log.scrollTop = log.scrollHeight; }

  function renderAll() {
    log.innerHTML = "";
    if (!state.messages.length) {
      var intro = document.createElement("div");
      intro.className = "intro";
      intro.textContent = "Hi! I answer questions using BIRC's facility documents — data retrieval, file server storage, workstations, instruments and more. Try:";
      var chips = document.createElement("div");
      chips.className = "chips";
      SUGGESTIONS.forEach(function (q) {
        var b = document.createElement("button");
        b.className = "chip"; b.type = "button"; b.textContent = q;
        b.onclick = function () { send(q); };
        chips.appendChild(b);
      });
      intro.appendChild(chips);
      log.appendChild(intro);
    }
    state.messages.forEach(function (m) { bubble(m.role, m.content); });
    scrollDown();
  }

  function setOpen(open) {
    state.open = open; save();
    panel.classList.toggle("open", open);
    fab.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) { syncTheme(); renderAll(); setTimeout(function () { input.focus(); }, 50); }
  }

  // ------------------------------------------------------------------ networking (SSE over fetch)
  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true;
    if (!state.messages.length) log.innerHTML = "";
    state.messages.push({ role: "user", content: text }); save();
    bubble("user", text);
    input.value = ""; autosize();

    var DOTS = '<span class="dots"><span></span><span></span><span></span></span>';
    var status = document.createElement("div");
    status.className = "status";
    status.innerHTML = DOTS;
    log.appendChild(status); scrollDown();
    var wakeTimer = setTimeout(function () {
      status.innerHTML = DOTS + " Waking up the assistant — this can take up to a minute…";
    }, 8000);

    var answer = "", el = null, failed = null;

    fetch(API + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: state.messages.slice(-12),
        conversation: state.cid,
        page: location.pathname,
      }),
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          var d = j && j.detail;
          throw new Error(typeof d === "string" ? d : "Request failed (" + res.status + ").");
        });
      }
      var reader = res.body.getReader();
      var dec = new TextDecoder();
      var buf = "";
      function handle(chunk) {
        var data = chunk.split("\n").filter(function (x) { return x.indexOf("data:") === 0; })
          .map(function (x) { return x.slice(5).trim(); }).join("");
        if (!data) return;
        var ev; try { ev = JSON.parse(data); } catch (e) { return; }
        if (ev.type === "text") {
          clearTimeout(wakeTimer);
          if (!el) { status.remove(); el = bubble("assistant", ""); }
          answer += ev.text;
          el.innerHTML = md(answer);
          scrollDown();
        } else if (ev.type === "error") {
          failed = ev.message;
        }
      }
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) { if (buf.trim()) handle(buf); return; }
          buf += dec.decode(r.value, { stream: true });
          var parts = buf.split("\n\n");
          buf = parts.pop();
          parts.forEach(handle);
          return pump();
        });
      }
      return pump();
    }).catch(function (err) {
      var msg = err && err.message;
      failed = failed || (msg && !/fetch|network|load failed/i.test(msg) ? msg
        : "Could not reach the assistant. Please check your connection and try again.");
    }).then(function () {
      clearTimeout(wakeTimer);
      status.remove();
      if (answer) state.messages.push({ role: "assistant", content: answer });
      if (failed) {
        bubble("error", failed);
        if (!answer) state.messages.pop(); // drop the unanswered question so history stays valid
      }
      save();
      busy = false; sendBtn.disabled = false;
      scrollDown(); input.focus();
    });
  }

  // ------------------------------------------------------------------ events
  function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; }
  fab.addEventListener("click", function () { setOpen(!state.open); });
  root.querySelector(".close").addEventListener("click", function () { setOpen(false); fab.focus(); });
  root.querySelector(".clear").addEventListener("click", function () {
    if (busy) return;
    state.messages = []; state.cid = newConversationId(); save(); renderAll(); input.focus();
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(input.value); }
  });
  root.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && state.open) { setOpen(false); fab.focus(); }
  });
  // Keep keystrokes inside the widget. From the page's point of view the focused
  // element is the shadow host (a <div>), so site shortcuts such as Quarto's
  // search keys (f, s, /) would otherwise fire while the user types here.
  ["keydown", "keyup", "keypress"].forEach(function (type) {
    root.addEventListener(type, function (e) { e.stopPropagation(); });
  });

  function mount() {
    document.body.appendChild(host);
    syncTheme();
    new MutationObserver(syncTheme).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    if (state.open) setOpen(true);
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
