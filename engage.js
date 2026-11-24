/* Engage overlay for the 1920x1080 stream scenes (stream.html, leonida.html).
   - Sub-goal bar in the top bar (manual count, or live from YouTube when a key + handle are set)
   - New-subscriber / goal-reached celebration with confetti
   - Rotating call-outs bottom-right: animated Subscribe + bell, chat vote, prediction, like
   Pages call Engage.update(state) on every render and Engage.event(msg) for server "engage" events.
   URL options: ?cta=3 (minutes between call-outs, 0 = off) · ?goal=0 (hide goal bar)
                ?ctatest=sub|vote|like|predict (preview one call-out on a loop) · ?sound=1           */
(() => {
  const P = new URLSearchParams(location.search);
  const CTA_MIN = P.has("cta") ? Math.max(0, +P.get("cta") || 0) : 3;
  const SHOW_GOAL = P.get("goal") !== "0";
  const SOUND = P.get("sound") === "1";
  const TEST = P.get("ctatest");
  const FOCUS = document.documentElement.dataset.focus || "leonida";
  const HOLD = 14000;

  const css = `
.eg-goal{display:flex;align-items:center;gap:14px;padding:9px 20px 9px 10px;border-radius:99px;background:rgba(255,0,51,.1);border:1px solid rgba(255,0,51,.5);min-width:440px;transition:box-shadow .6s,transform .6s cubic-bezier(.34,1.56,.64,1)}
.eg-goal.pop{box-shadow:0 0 0 3px #ff0033,0 0 70px -6px #ff0033;transform:scale(1.07)}
.eg-yt{width:46px;height:46px;border-radius:50%;background:#ff0033;display:grid;place-items:center;flex:none;box-shadow:0 0 26px -4px #ff0033}
.eg-yt svg{width:24px;height:24px}
.eg-gt{flex:1;min-width:0}
.eg-gk{font:700 14px "JetBrains Mono",monospace;letter-spacing:.16em;color:#ff8da1;display:flex;justify-content:space-between;gap:12px;white-space:nowrap}
.eg-gk span{color:var(--muted);letter-spacing:.06em}
.eg-gbar{margin-top:7px;height:10px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden}
.eg-gbar i{display:block;height:100%;width:0;border-radius:9px;background:linear-gradient(90deg,#ff0033,#ff6b93);transition:width 1.6s cubic-bezier(.2,.8,.2,1);position:relative;overflow:hidden;box-shadow:0 0 16px #ff0033}
.eg-gbar i::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);transform:translateX(-100%);animation:egsweep 2.6s ease-in-out infinite}
@keyframes egsweep{to{transform:translateX(100%)}}
.eg-gn{font:800 30px Unbounded,sans-serif;letter-spacing:-.03em;white-space:nowrap}
.eg-gn small{font:600 17px "JetBrains Mono",monospace;color:var(--muted);letter-spacing:0;margin-left:4px}
.eg-goal .eg-nc{display:none;font:800 19px Unbounded,sans-serif;letter-spacing:.02em}
.eg-goal .eg-nc em{font:600 14px "JetBrains Mono",monospace;font-style:normal;color:var(--muted);letter-spacing:.06em;display:block;margin-top:2px}
.eg-goal.nocount{min-width:0}
.eg-goal.nocount .eg-gt,.eg-goal.nocount .eg-gn{display:none}
.eg-goal.nocount .eg-nc{display:block}
.eg-bellmini{width:26px;height:26px;flex:none;display:none}
.eg-goal.nocount .eg-bellmini{display:block;animation:egring 1.1s ease 2s infinite;animation-play-state:running}
.eg-bellmini svg,.eg-bell svg{width:100%;height:100%;fill:none;stroke:var(--ink);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;transform-origin:50% 8%}
@keyframes egring{0%,60%,100%{transform:rotate(0)}8%{transform:rotate(16deg)}16%{transform:rotate(-14deg)}24%{transform:rotate(10deg)}32%{transform:rotate(-6deg)}40%{transform:rotate(3deg)}}

.eg-cta{--ec:#ff0033;position:absolute;right:44px;bottom:92px;width:640px;z-index:31;padding:20px 24px 24px;border-radius:22px;background:rgba(14,11,20,.95);border:2px solid var(--ec);
  box-shadow:0 0 0 5px color-mix(in srgb,var(--ec) 14%,transparent),0 0 70px -14px var(--ec),0 24px 50px -16px #000;transform:translateX(125%);opacity:0;
  transition:opacity .45s cubic-bezier(.2,.8,.2,1),transform .75s cubic-bezier(.34,1.56,.64,1);pointer-events:none}
.eg-cta.show{transform:none;opacity:1}
.eg-cta.vote{--ec:#2fd4f0}.eg-cta.predict{--ec:#a678ff}.eg-cta.like{--ec:#3ea6ff}
.eg-k{font:700 13px "JetBrains Mono",monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--ec)}
.eg-row{display:flex;align-items:center;gap:16px;margin-top:12px}
.eg-av{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#ffe27a,#ffb21e 50%,#ff7a2f);display:grid;place-items:center;font:800 20px Unbounded,sans-serif;color:#1a1205;flex:none;box-shadow:0 0 0 3px rgba(255,255,255,.1)}
.eg-ch{flex:1;min-width:0}
.eg-ch b{display:block;font:700 22px/1.2 Unbounded,sans-serif;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.eg-ch span{font:14px "JetBrains Mono",monospace;color:var(--muted)}
.eg-btn{flex:none;padding:14px 24px;border-radius:99px;background:#ff0033;color:#fff;font:800 17px Inter,sans-serif;letter-spacing:.06em;transition:background .35s,color .35s,transform .14s;white-space:nowrap}
.eg-btn.press,.eg-bell.press,.eg-like.press{transform:scale(.88)}
.eg-btn.done{background:rgba(255,255,255,.14);color:var(--ink)}
.eg-bell{width:52px;height:52px;padding:13px;border-radius:50%;background:rgba(255,255,255,.08);flex:none;transition:background .35s,transform .14s;position:relative}
.eg-bell.on{background:rgba(255,178,30,.2)}
.eg-bell.on svg{fill:#ffb21e;stroke:#ffb21e;animation:egring 1.2s ease}
.eg-bell .eg-tip{position:absolute;right:-4px;top:-38px;white-space:nowrap;font:700 13px "JetBrains Mono",monospace;letter-spacing:.06em;padding:5px 10px;border-radius:8px;background:#ffb21e;color:#1a1205;opacity:0;transform:translateY(6px);transition:.4s cubic-bezier(.34,1.56,.64,1)}
.eg-bell.on .eg-tip{opacity:1;transform:none}
.eg-hook{margin-top:16px;font:600 20px/1.38 Inter,sans-serif;color:var(--ink)}
.eg-hook b{color:var(--ec)}
.eg-q{font:700 25px/1.25 Unbounded,sans-serif;letter-spacing:-.02em;margin-top:10px}
.eg-opts{display:grid;gap:10px;margin-top:16px}
.eg-opt{display:grid;grid-template-columns:44px 1fr auto;align-items:center;gap:14px;padding:9px 16px 9px 10px;border-radius:14px;background:color-mix(in srgb,var(--tc,var(--ec)) 10%,transparent);
  border:1px solid color-mix(in srgb,var(--tc,var(--ec)) 40%,transparent);opacity:0;transform:translateX(40px);transition:opacity .5s,transform .6s cubic-bezier(.34,1.56,.64,1),box-shadow .4s;transition-delay:var(--d)}
.eg-cta.show .eg-opt{opacity:1;transform:none}
.eg-opt b{width:44px;height:44px;border-radius:12px;background:var(--tc,var(--ec));color:#0b0a10;display:grid;place-items:center;font:800 22px Unbounded,sans-serif}
.eg-opt span{font:600 19px Inter,sans-serif}
.eg-opt em{font:600 16px "JetBrains Mono",monospace;color:var(--muted);font-style:normal}
.eg-opt.hl{box-shadow:0 0 0 2px var(--tc,var(--ec)),0 0 34px -6px var(--tc,var(--ec))}
.eg-hint{margin-top:14px;font:600 16px "JetBrains Mono",monospace;color:var(--muted);display:flex;align-items:center;gap:10px}
.eg-hint b{color:var(--ink);background:rgba(255,255,255,.12);padding:2px 9px;border-radius:7px}
.eg-chat{display:inline-flex;align-items:center;gap:8px;margin-left:auto;padding:6px 12px;border-radius:10px;background:rgba(255,255,255,.07);color:var(--ink);font:600 15px Inter,sans-serif}
.eg-chat i{font-style:normal;color:var(--ec);font-weight:700}
.eg-chat u{text-decoration:none;display:inline-block;width:2px;height:16px;background:var(--ink);animation:egblink 1s steps(2) infinite}
@keyframes egblink{50%{opacity:0}}
.eg-like{width:64px;height:64px;padding:15px;border-radius:50%;background:rgba(255,255,255,.08);flex:none;transition:background .35s,transform .14s;position:relative}
.eg-like svg{width:100%;height:100%;fill:none;stroke:var(--ink);stroke-width:2;stroke-linejoin:round}
.eg-like.on{background:rgba(62,166,255,.2)}
.eg-like.on svg{fill:#3ea6ff;stroke:#3ea6ff;animation:egpop .6s cubic-bezier(.34,1.56,.64,1)}
@keyframes egpop{0%{transform:scale(1)}40%{transform:scale(1.45) rotate(-12deg)}100%{transform:scale(1)}}
.eg-like .eg-plus{position:absolute;left:50%;top:-6px;font:800 18px Unbounded,sans-serif;color:#3ea6ff;opacity:0;transform:translate(-50%,0)}
.eg-like.on .eg-plus{animation:egfloat 1.4s ease-out forwards}
@keyframes egfloat{0%{opacity:0;transform:translate(-50%,10px)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-44px)}}
.eg-cursor{position:absolute;left:0;top:0;width:36px;height:36px;opacity:0;z-index:2;filter:drop-shadow(0 4px 8px rgba(0,0,0,.8));transition:transform .95s cubic-bezier(.5,0,.2,1),opacity .35s}
.eg-cursor::after{content:"";position:absolute;left:-14px;top:-14px;width:30px;height:30px;border-radius:50%;border:3px solid #fff;opacity:0}
.eg-cursor.click::after{animation:egclick .5s ease-out}
@keyframes egclick{0%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(1.6)}}
.eg-cta .eg-bar{position:absolute;left:24px;right:24px;bottom:10px;height:3px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden}
.eg-cta .eg-bar i{display:block;height:100%;background:var(--ec);transform-origin:left;transform:scaleX(0)}
.eg-cta.show .eg-bar i{animation:egfill ${HOLD}ms linear forwards}
@keyframes egfill{to{transform:scaleX(1)}}

.eg-cel{position:absolute;left:50%;top:150px;z-index:36;text-align:center;padding:24px 60px 30px;border-radius:28px;background:rgba(14,11,20,.95);border:2px solid #ff0033;
  box-shadow:0 0 0 6px rgba(255,0,51,.16),0 0 120px -10px #ff0033,0 30px 60px -20px #000;opacity:0;transform:translate(-50%,-40px) scale(.85);
  transition:opacity .4s,transform .8s cubic-bezier(.34,1.56,.64,1);pointer-events:none;min-width:620px}
.eg-cel.show{opacity:1;transform:translate(-50%,0) scale(1)}
.eg-cel .k{font:700 15px "JetBrains Mono",monospace;letter-spacing:.26em;color:#ff8da1}
.eg-cel .t{font:800 56px/1.1 Unbounded,sans-serif;letter-spacing:-.035em;margin-top:8px;background:linear-gradient(100deg,#fff,#ffc2d0);-webkit-background-clip:text;background-clip:text;color:transparent}
.eg-cel .m{font:600 21px Inter,sans-serif;color:var(--muted);margin-top:8px}
.eg-cel .m b{color:var(--ink)}
.eg-conf{position:absolute;left:0;top:0;width:1920px;height:1080px;z-index:35;pointer-events:none}`;

  const ICON = {
    yt: '<svg viewBox="0 0 24 24"><path fill="#fff" d="M9 6.8v10.4L17.5 12z"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 10.5a6 6 0 1 1 12 0c0 4.8 2 6.2 2 6.2H4s2-1.4 2-6.2Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    thumb: '<svg viewBox="0 0 24 24"><path d="M2.5 10.5h3.5v10H2.5zM8 20.5h9.3a2 2 0 0 0 2-1.6l1.5-7a2 2 0 0 0-2-2.4H14l.7-3.6a2 2 0 0 0-3.4-1.8L8 10Z"/></svg>',
    cursor: '<svg viewBox="0 0 24 24" width="36" height="36"><path d="M4 2.5 19.5 12l-6.6 1.6 3.6 7-3 1.5-3.5-7.1L4.8 19.5Z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  };

  const TEAMC = { a: "#ff3d8b", b: "#2fd4f0", c: "#ffb21e" };
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let S = null, dom = null, lastSubs, mi = 0, hookI = 0, busy = false, timers = [];

  const total = id => { const w = S.milestones.reduce((s, m) => s + m.weight, 0); return S.milestones.reduce((s, m) => s + (m.values[id] || 0) * m.weight, 0) / w; };
  const team = id => S.teams.find(t => t.id === id) || S.teams[0];
  const stageOf = id => { const ms = S.milestones; for (let i = ms.length - 1; i >= 0; i--) { const v = ms[i].values[id] || 0; if (v > 0 && v < 100) return ms[i]; } return ms.find(m => (m.values[id] || 0) < 100); };
  const PHRASE = { "Graphics": "put its first real picture on screen", "Main Menu": "reach the main menu", "In-Game": "load into the world", "Playable": "become fully playable",
                   "Boot": "boot all the way", "Runtime": "finish its runtime", "Shaders": "finish its shaders" };
  const phrase = id => { const s = stageOf(id); return s ? (PHRASE[s.name] || "clear " + s.name) : "cross the finish line"; };
  const cfg = () => S?.stream || {};
  const subsNow = () => { const y = S?.live?.youtube?.subs; if (Number.isFinite(y)) return y; const m = cfg().subs; return Number.isFinite(m) ? m : null; };
  const goalFor = subs => { const g = Math.max(1, +cfg().subGoal || 100), step = +cfg().goalStep || 0;
    return subs == null || subs < g || !step ? g : g + Math.ceil((subs - g + 1) / step) * step; };
  const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M" : n >= 1e4 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + "K" : n.toLocaleString();
  const chName = () => cfg().channelName || team(FOCUS).name;
  const initials = s => s.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  function ensureDom() {
    if (dom) return;
    const stage = document.getElementById("stage"); if (!stage) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const right = stage.querySelector(".top .right");
    const goal = document.createElement("div");
    goal.className = "eg-goal nocount";
    goal.innerHTML = `<div class="eg-yt">${ICON.yt}</div>
      <div class="eg-gt"><div class="eg-gk">SUB GOAL <span id="egLeft"></span></div><div class="eg-gbar"><i id="egBar"></i></div></div>
      <div class="eg-gn"><span id="egSubs">0</span><small>/ <span id="egGoalN">100</span></small></div>
      <div class="eg-nc">SUBSCRIBE<em>and turn on the bell</em></div><div class="eg-bellmini">${ICON.bell}</div>`;
    if (right && SHOW_GOAL) right.prepend(goal);
    const cta = document.createElement("div"); cta.className = "eg-cta";
    cta.innerHTML = `<div class="eg-body"></div><div class="eg-cursor">${ICON.cursor}</div><div class="eg-bar"><i></i></div>`;
    const cel = document.createElement("div"); cel.className = "eg-cel";
    const cv = document.createElement("canvas"); cv.className = "eg-conf"; cv.width = 1920; cv.height = 1080;
    stage.append(cta, cel, cv);
    dom = { goal, cta, body: cta.querySelector(".eg-body"), cursor: cta.querySelector(".eg-cursor"), cel, cv };
  }

  /* ---------- sub goal ---------- */
  function tweenNum(el, to) {
    const from = +el.dataset.v || 0; el.dataset.v = to;
    if (from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1400;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); setTimeout(() => el.textContent = fmt(to), dur + 100);   // lands even if frames are paused
  }
  function renderGoal() {
    const subs = subsNow(), g = dom.goal;
    g.classList.toggle("nocount", subs == null);
    if (subs == null) return;
    const goal = goalFor(subs);
    tweenNum(g.querySelector("#egSubs"), subs);
    g.querySelector("#egGoalN").textContent = fmt(goal);
    g.querySelector("#egLeft").textContent = `${fmt(goal - subs)} to go`;
    g.querySelector("#egBar").style.width = Math.min(100, subs / goal * 100).toFixed(1) + "%";
  }

  /* ---------- celebration ---------- */
  function celebrate(kind, subs, n = 1) {
    if (document.hidden || !dom) return;
    const goal = goalFor(subs), c = dom.cel;
    c.innerHTML = kind === "goal"
      ? `<div class="k">🎉 SUB GOAL REACHED 🎉</div><div class="t">${fmt(subs)} subscribers!</div><div class="m">Thank you all — next goal <b>${fmt(goal)}</b></div>`
      : `<div class="k">NEW SUBSCRIBER${n > 1 ? "S" : ""} 🔔</div><div class="t">${n > 1 ? `+${n} — thank you!` : "Thank you! 🎉"}</div><div class="m"><b>${fmt(subs)}</b> / ${fmt(goal)} · only <b>${fmt(goal - subs)}</b> to the goal</div>`;
    c.classList.remove("show"); void c.offsetWidth; c.classList.add("show");
    dom.goal.classList.add("pop"); setTimeout(() => dom.goal.classList.remove("pop"), 2400);
    confetti(kind === "goal" ? 340 : 170, kind === "goal");
    chime(kind === "goal" ? [523, 659, 784, 1047, 1319] : [659, 880, 1175]);
    clearTimeout(celebrate.t); celebrate.t = setTimeout(() => c.classList.remove("show"), kind === "goal" ? 9000 : 6500);
  }
  function confetti(count, cannons) {
    const cv = dom.cv, ctx = cv.getContext("2d"), cols = ["#ff0033", "#ffb21e", "#ff3d8b", "#2fd4f0", "#ffffff", "#a678ff"];
    const ps = [];
    const spawn = (x, y, a0, a1, sp) => { const a = a0 + Math.random() * (a1 - a0), v = sp * (0.55 + Math.random() * 0.6);
      ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, w: 8 + Math.random() * 8, h: 12 + Math.random() * 10, c: cols[(Math.random() * cols.length) | 0] }); };
    for (let i = 0; i < count; i++) spawn(960 + (Math.random() - .5) * 500, 320, -Math.PI * .97, -Math.PI * .03, 10.5);
    if (cannons) for (let i = 0; i < count / 2; i++) { spawn(40, 1060, -Math.PI * .45, -Math.PI * .22, 19); spawn(1880, 1060, -Math.PI * .78, -Math.PI * .55, 19); }
    const t0 = performance.now(), LIFE = 5200; let last = t0;
    const frame = now => {
      const age = now - t0, k = Math.min(4, (now - last) / 16.67); last = now;   // time-based: same motion at 30 or 60 fps
      ctx.clearRect(0, 0, 1920, 1080);
      for (const p of ps) { p.vy += .22 * k; const dr = Math.pow(.99, k); p.vx *= dr; p.vy *= dr;
        p.x += (p.vx + Math.sin(age / 180 + p.r) * .7) * k; p.y += p.vy * k; p.r += p.vr * k;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - Math.max(0, age - LIFE * .6) / (LIFE * .4)); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.r * 2)), p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 1); ctx.restore(); }
      if (age < LIFE) requestAnimationFrame(frame); else ctx.clearRect(0, 0, 1920, 1080);
    };
    requestAnimationFrame(frame);
  }
  let actx;
  function chime(notes) {
    if (!SOUND) return;
    try { actx ||= new AudioContext();
      notes.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + i * .1;
        o.type = "triangle"; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.16, t0 + .02); g.gain.exponentialRampToValueAtTime(.001, t0 + .7);
        o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + .75); });
    } catch {}
  }

  /* ---------- call-outs ---------- */
  const T = (ms, fn) => timers.push(setTimeout(fn, ms));
  function cursorTo(el, instant) {
    const c = dom.cursor; let x = 0, y = 0, e = el;
    while (e && e !== dom.cta) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    if (instant) { c.style.transition = "none"; }
    c.style.transform = `translate(${x + el.offsetWidth * .55}px,${y + el.offsetHeight * .6}px)`;
    if (instant) { void c.offsetWidth; c.style.transition = ""; }
  }
  function cursorStart() { const c = dom.cursor; c.style.transition = "none"; c.style.transform = `translate(${dom.cta.offsetWidth + 60}px,${dom.cta.offsetHeight + 40}px)`; void c.offsetWidth; c.style.transition = ""; c.style.opacity = 1; }
  function click(el, after) {
    const c = dom.cursor; c.classList.remove("click"); void c.offsetWidth; c.classList.add("click");
    el.classList.add("press"); setTimeout(() => { el.classList.remove("press"); after && after(); }, 150);
  }

  const MOMENTS = {
    sub() {
      const L = team(FOCUS), ranked = [...S.teams].sort((a, b) => total(b.id) - total(a.id)), lead = ranked[0], subs = subsNow();
      const hooks = [
        `${esc(L.name)} is <b>${total(L.id).toFixed(1)}%</b> there — subscribe to watch it ${phrase(L.id)} <b>live</b>`,
        `Hit the <b>🔔 bell</b> — you'll know the moment the next milestone falls`,
        lead.id === L.id ? `${esc(L.name)} is <b>leading the race</b> — subscribe and watch it hold on` :
          `<b>${esc(lead.name)}</b> leads at <b>${total(lead.id).toFixed(1)}%</b> — subscribe to see if ${esc(L.name)} catches up`,
        `New dev updates every hour — subscribe so you don't miss the <b>first real frame</b>`,
      ];
      const hook = hooks[hookI++ % hooks.length];
      dom.body.innerHTML = `<div class="eg-k">▶ Enjoying the race?</div>
        <div class="eg-row"><div class="eg-av">${esc(initials(chName()))}</div>
          <div class="eg-ch"><b>${esc(chName())}</b><span>${subs != null ? `${fmt(subs)} subscribers · join them` : "GTA VI PC port race · live"}</span></div>
          <div class="eg-btn">SUBSCRIBE</div><div class="eg-bell">${ICON.bell}<span class="eg-tip">ALL NOTIFICATIONS</span></div></div>
        <div class="eg-hook">${hook}</div>`;
      const btn = dom.body.querySelector(".eg-btn"), bell = dom.body.querySelector(".eg-bell");
      T(800, cursorStart); T(900, () => cursorTo(btn));
      T(2000, () => click(btn, () => { btn.classList.add("done"); btn.textContent = "SUBSCRIBED ✓"; chime([784, 1047]); }));
      T(2900, () => cursorTo(bell));
      T(3950, () => click(bell, () => { bell.classList.add("on"); chime([1175, 1568]); }));
      T(5600, () => dom.cursor.style.opacity = 0);
    },
    vote() {
      const opts = S.teams.map((t, i) => ({ n: i + 1, t }));
      const q = ["Who reaches gameplay first?", "Who wins the PC port race?", "Who boots to a playable build first?"][mi % 3];
      dom.body.innerHTML = `<div class="eg-k">💬 Chat vote</div><div class="eg-q">${q}</div>
        <div class="eg-opts">${opts.map((o, i) => `<div class="eg-opt" style="--tc:${TEAMC[o.t.color] || "#ffb21e"};--d:${(.35 + i * .14).toFixed(2)}s"><b>${o.n}</b><span>${esc(o.t.name)}</span><em>${total(o.t.id).toFixed(1)}%</em></div>`).join("")}</div>
        <div class="eg-hint">Type <b>${opts.map(o => o.n).join("</b> <b>")}</b> in chat <span class="eg-chat">you: <i class="eg-typed"></i><u></u></span></div>`;
      highlightLoop();
      const typed = dom.body.querySelector(".eg-typed"), pick = String(opts.find(o => o.t.id === FOCUS)?.n ?? 1);
      T(4200, () => typed.textContent = pick); T(5200, () => typed.textContent = pick + " 🔥");
    },
    predict() {
      const L = team(FOCUS), s = stageOf(L.id);
      dom.body.innerHTML = `<div class="eg-k">🔮 Prediction</div><div class="eg-q">When will ${esc(L.name)} ${phrase(L.id)}?</div>
        <div class="eg-opts">${["Today", "This week", "This month"].map((x, i) => `<div class="eg-opt" style="--tc:var(--ec);--d:${(.35 + i * .14).toFixed(2)}s"><b>${i + 1}</b><span>${x}</span><em>${i === 0 && s ? `now ${s.values[L.id] || 0}%` : ""}</em></div>`).join("")}</div>
        <div class="eg-hint">Drop your guess in chat 👇 <span class="eg-chat">you: <i class="eg-typed"></i><u></u></span></div>`;
      highlightLoop();
      const typed = dom.body.querySelector(".eg-typed");
      T(4200, () => typed.textContent = "2"); T(5000, () => typed.textContent = "2 👀");
    },
    like() {
      const L = team(FOCUS);
      dom.body.innerHTML = `<div class="eg-k">👍 Quick favour</div>
        <div class="eg-row"><div class="eg-like">${ICON.thumb}<span class="eg-plus">+1</span></div>
          <div class="eg-q" style="margin:0">Smash like if you want ${esc(L.name)} to win the race!</div></div>
        <div class="eg-hook">It pushes the stream to more people — <b>thank you</b> 🙏</div>`;
      const like = dom.body.querySelector(".eg-like");
      T(800, cursorStart); T(900, () => cursorTo(like));
      T(2000, () => click(like, () => { like.classList.add("on"); chime([880, 1320]); }));
      T(3600, () => dom.cursor.style.opacity = 0);
    },
  };
  function highlightLoop() {
    const os = [...dom.body.querySelectorAll(".eg-opt")];
    os.forEach((o, i) => { T(1500 + i * 700, () => o.classList.add("hl")); T(2100 + i * 700, () => o.classList.remove("hl")); });
    T(1500 + os.length * 700 + 300, () => os.forEach(o => o.classList.add("hl")));
    T(1500 + os.length * 700 + 1100, () => os.forEach(o => o.classList.remove("hl")));
  }
  function run(kind) {
    if (!S || !dom || busy || !MOMENTS[kind] || document.hidden) return;
    busy = true; timers.forEach(clearTimeout); timers = [];
    dom.cta.className = "eg-cta " + kind; dom.cursor.style.opacity = 0;
    MOMENTS[kind]();
    void dom.cta.offsetWidth; dom.cta.classList.add("show");
    T(HOLD, () => { dom.cta.classList.remove("show"); T(800, () => busy = false); });
  }
  const ORDER = ["sub", "vote", "sub", "like", "sub", "predict"];
  function schedule(first) {
    if (TEST) { setTimeout(() => { run(TEST); setInterval(() => run(TEST), HOLD + 4000); }, 1200); return; }
    if (!CTA_MIN) return;
    setTimeout(() => { run(ORDER[mi++ % ORDER.length]); schedule(false); }, first ? 45e3 : CTA_MIN * 60e3);
  }

  let started = false;
  window.Engage = {
    update(state) {
      if (window.STATIC_DATA) return;               // the public website doesn't run stream call-outs
      S = state; ensureDom(); if (!dom) return;
      const subs = subsNow();
      if (lastSubs != null && subs != null && subs > lastSubs) {
        if (subs >= goalFor(lastSubs)) celebrate("goal", subs); else celebrate("sub", subs, subs - lastSubs);
      }
      lastSubs = subs; renderGoal();
      if (!started) { started = true; schedule(true); }
    },
    event(m) {
      if (!S || !dom) return;
      if (m.type === "test-sub") { const s = (subsNow() ?? 0) + 1; celebrate("sub", s); }
      else if (m.type === "test-goal") celebrate("goal", goalFor(subsNow() ?? 0));
      else if (m.type === "cta") { busy = false; run(m.moment || "sub"); }
    },
    run, celebrate,
  };
})();
