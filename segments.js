/* Broadcast segments for the 1920x1080 stream scenes (stream.html, leonida.html) and their website copies.
   Every couple of minutes a full-screen segment takes over for 15 s, like a sports broadcast:
     standings · battle watch · new here? · next mission · the last hour · what you missed
   An "UP NEXT" chip in the top bar counts down to the next one, so there is always something coming.
   Pages call Segments.update(state) on every render.
   URL options: ?seg=2 (minutes between segments, 0 = off) · ?segtest=standings|battle|explain|mission|hour|news · ?seghold=60   */
(() => {
  const P = new URLSearchParams(location.search);
  const EVERY = (P.has("seg") ? Math.max(0, +P.get("seg") || 0) : 2) * 60e3;
  const TEST = P.get("segtest");
  const HOLD = (+P.get("seghold") || 15) * 1000;   // ?seghold=60 keeps a segment up longer (previews)
  const FOCUS = document.documentElement.dataset.focus || "leonida";
  const ORDER = ["standings", "battle", "explain", "mission", "hour", "battle", "news"];
  const NAME = { standings: "Race standings", battle: "Battle watch", explain: "New here?", mission: "Next mission", hour: "The last hour", news: "What you missed" };
  const STATIC = () => !!window.STATIC_DATA;

  const css = `
.sg{position:absolute;inset:0;z-index:34;pointer-events:none;visibility:hidden;opacity:0;transition:opacity .45s,visibility 0s .45s;--hold:${HOLD}ms}
.sg.show{visibility:visible;opacity:1;transition:opacity .45s}
.sg-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(40,10,62,.88),rgba(6,2,14,.96) 72%);backdrop-filter:blur(12px) saturate(120%);-webkit-backdrop-filter:blur(12px) saturate(120%)}
.sg-wipe{position:absolute;top:-20%;bottom:-20%;left:-40%;width:180%;background:linear-gradient(90deg,transparent 0 14%,#ff3d8b 14% 30%,#ffb21e 30% 46%,#2fd4f0 46% 62%,transparent 62%);transform:translateX(-120%) skewX(-16deg);z-index:3}
.sg.show .sg-wipe{animation:sgwipe 1.05s cubic-bezier(.75,0,.25,1) forwards}
@keyframes sgwipe{to{transform:translateX(120%) skewX(-16deg)}}
.sg-box{position:absolute;left:110px;right:110px;top:64px;bottom:58px;display:flex;flex-direction:column}
.sg-h{display:grid;gap:4px}
.sg-k{font:700 17px "JetBrains Mono",monospace;letter-spacing:.3em;text-transform:uppercase;color:#ff6b86;opacity:0;transform:translateY(10px);transition:opacity .5s .45s,transform .5s .45s}
.sg-k i{display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff2d55;margin-right:12px;vertical-align:1px;animation:sgdot 1.2s ease-in-out infinite}
@keyframes sgdot{50%{opacity:.25}}
.sg-t{font:400 104px/1 Anton,Impact,sans-serif;letter-spacing:.02em;text-transform:uppercase;color:#ffd23f;transform-origin:left center;
  text-shadow:0 5px 0 #3a1d00,3px 3px 0 #000,-3px 3px 0 #000,3px -3px 0 #000,-3px -3px 0 #000,0 0 50px rgba(255,190,40,.45);opacity:0;transform:scale(1.35);transition:transform .7s cubic-bezier(.34,1.56,.64,1) .5s,opacity .3s .5s}
.sg-s{font:600 26px/1.3 Inter,sans-serif;color:#fff;opacity:0;transition:opacity .5s .8s}
.sg-s b{color:#ffd23f}
.sg.show .sg-k,.sg.show .sg-s,.sg.show .sg-t{opacity:1;transform:none}
.sg-body{flex:1;min-height:0;margin-top:26px;position:relative}
.sg-f{display:flex;align-items:center;gap:18px;font:700 15px "JetBrains Mono",monospace;letter-spacing:.16em;color:var(--muted);text-transform:uppercase;white-space:nowrap}
.sg-f b{color:#ffd23f}
.sg-bar{flex:1;height:4px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden}
.sg-bar i{display:block;height:100%;background:#ffd23f;transform-origin:left;transform:scaleX(0)}
.sg.show .sg-bar i{animation:sgfill var(--hold) linear forwards}
@keyframes sgfill{to{transform:scaleX(1)}}
.sg .in,.sg .up{opacity:0;transition:opacity .5s ease var(--d,0s),transform .75s cubic-bezier(.34,1.56,.64,1) var(--d,0s)}
.sg .in{transform:translateX(-60px)} .sg .up{transform:translateY(34px)}
.sg.show .in,.sg.show .up{opacity:1;transform:none}
.sg-note{font:600 25px/1.35 Inter,sans-serif;color:#fff;text-align:center;margin-top:24px}
.sg-note b{color:#7be07b}
.sg-lbl{font:700 15px "JetBrains Mono",monospace;letter-spacing:.2em;color:#ffd23f;text-transform:uppercase;margin-bottom:14px}

/* standings */
.sgs{display:grid;gap:8px}
.sgr{display:grid;grid-template-columns:60px 330px 200px 1fr 150px 110px;align-items:center;gap:20px;height:62px;padding:0 22px 0 10px;border-radius:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07);box-shadow:inset 6px 0 0 var(--tc)}
.sgr.me{background:linear-gradient(90deg,color-mix(in srgb,var(--tc) 24%,transparent),rgba(255,255,255,.03));border-color:color-mix(in srgb,var(--tc) 60%,transparent)}
.sgr .ps{font:400 40px/1 Anton,sans-serif;text-align:center;color:#fff}
.sgr.lead .ps,.sgr.lead .gp{color:#ffd23f}
.sgr .nm{font:400 30px/1 Anton,sans-serif;letter-spacing:.03em;text-transform:uppercase;color:var(--tc);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgr .nm small{display:block;font:600 13px "JetBrains Mono",monospace;color:var(--muted);letter-spacing:.04em;text-transform:none;margin-top:5px;overflow:hidden;text-overflow:ellipsis}
.sgr .stp{font:700 15px "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase;color:#0b0614;background:var(--tc);padding:5px 10px;border-radius:6px;justify-self:start;white-space:nowrap}
.sgr .br{position:relative;height:14px;border-radius:9px;background:rgba(255,255,255,.08)}
.sgr .br i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:9px;background:linear-gradient(90deg,color-mix(in srgb,var(--tc) 35%,transparent),var(--tc));box-shadow:0 0 14px var(--tc);transition:width 1.5s cubic-bezier(.2,.8,.2,1)}
.sgr .br u{position:absolute;top:-5px;bottom:-5px;width:2px;background:rgba(255,255,255,.22)}
.sgr .br u.pl{background:#7be07b;width:3px}
.sgr .pc{font:400 44px/1 Anton,sans-serif;color:#fff;text-align:right}
.sgr .pc small{font-size:24px;color:var(--tc)}
.sgr .gp{font:700 18px "JetBrains Mono",monospace;color:var(--muted);text-align:right}

/* battle */
.sgb{display:grid;grid-template-columns:1fr 230px 1fr;gap:28px;align-items:stretch}
.sgb .sd{padding:28px 34px;border-radius:24px;background:linear-gradient(160deg,color-mix(in srgb,var(--tc) 22%,rgba(10,5,18,.7)),rgba(10,5,18,.75));border:2px solid color-mix(in srgb,var(--tc) 65%,transparent);box-shadow:0 0 90px -24px var(--tc);display:flex;flex-direction:column;gap:12px;min-width:0}
.sgb .rk{font:700 18px "JetBrains Mono",monospace;letter-spacing:.2em;color:var(--tc);text-transform:uppercase}
.sgb .nm{font:400 62px/1 Anton,sans-serif;text-transform:uppercase;color:#fff;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgb .pc{font:400 150px/.9 Anton,sans-serif;color:#fff;text-shadow:0 6px 0 color-mix(in srgb,var(--tc) 55%,#000),0 0 50px color-mix(in srgb,var(--tc) 50%,transparent)}
.sgb .pc small{font-size:62px;color:var(--tc)}
.sgb .kv{display:grid;grid-template-columns:1fr 1fr;gap:12px 22px;margin-top:6px}
.sgb .kv div{font:700 14px "JetBrains Mono",monospace;letter-spacing:.12em;color:var(--muted);text-transform:uppercase}
.sgb .kv b{display:block;font:400 31px/1.1 Anton,sans-serif;color:#fff;letter-spacing:.03em;text-transform:uppercase;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgb .hl{font:600 21px/1.35 Inter,sans-serif;color:#fff;opacity:.88;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sgb .vs{display:grid;place-items:center;align-content:center;gap:14px;text-align:center}
.sgb .vs b{font:400 160px/1 Anton,sans-serif;color:#ffd23f;text-shadow:0 6px 0 #3a1d00,3px 3px 0 #000,-3px -3px 0 #000,0 0 60px rgba(255,190,40,.5);animation:sgvs 1.4s ease-in-out infinite alternate}
@keyframes sgvs{to{transform:scale(1.1)}}
.sgb .vs span{font:700 18px/1.4 "JetBrains Mono",monospace;letter-spacing:.16em;color:#fff;text-transform:uppercase}

/* explainer */
.sge{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
.sge .cd{padding:26px 26px 28px;border-radius:20px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.1);display:flex;flex-direction:column;gap:12px}
.sge .cd i{font:400 64px/1 Anton,sans-serif;color:#ffd23f;font-style:normal}
.sge .cd b{font:400 32px/1.08 Anton,sans-serif;text-transform:uppercase;color:#fff;letter-spacing:.02em}
.sge .cd span{font:500 21px/1.42 Inter,sans-serif;color:var(--muted)}
.sge .cd span em{font-style:normal;color:#fff;font-weight:700}
.sgl{position:relative;height:150px;margin:36px 40px 0}
.sgl .tr{position:absolute;left:0;right:0;top:84px;height:14px;border-radius:9px;background:rgba(255,255,255,.08)}
.sgl .well{position:absolute;top:84px;height:14px;right:0;border-radius:0 9px 9px 0;background:linear-gradient(90deg,rgba(123,224,123,.4),rgba(123,224,123,.08))}
.sgl .cp{position:absolute;top:79px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px}
.sgl .cp i{width:24px;height:24px;border-radius:50%;border:4px solid #ffd23f;background:#1a0a22;box-shadow:0 0 14px rgba(255,210,63,.5)}
.sgl .cp span{font:700 14px "JetBrains Mono",monospace;letter-spacing:.08em;color:#fff;text-transform:uppercase;white-space:nowrap}
.sgl .cp span small{display:block;text-align:center;color:#ffd23f;font-size:13px}
.sgl .cp.pl i{border-color:#7be07b;box-shadow:0 0 18px #7be07b}
.sgl .mk{position:absolute;top:0;left:0;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;transition:left 1.6s cubic-bezier(.2,.8,.2,1) .6s}
.sgl .mk b{font:400 24px/1 Anton,sans-serif;color:var(--tc);text-transform:uppercase;white-space:nowrap;padding:5px 12px;border-radius:8px;background:rgba(10,5,18,.85);border:2px solid var(--tc)}
.sgl .mk::after{content:"";border-left:10px solid transparent;border-right:10px solid transparent;border-top:12px solid var(--tc);margin-top:2px}
.sg-cta{margin-top:12px;text-align:center;font:700 28px Inter,sans-serif;color:#fff}
.sg-cta b{color:#ff6b86}

/* last hour */
.sgh{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
.sgh .ct{padding:20px 26px 22px;border-radius:20px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.1)}
.sgh .ct b{display:block;font:400 96px/1 Anton,sans-serif;color:#fff}
.sgh .ct.g b{color:#7be07b;text-shadow:0 3px 0 #0c2a0c}
.sgh .ct span{font:700 16px "JetBrains Mono",monospace;letter-spacing:.14em;color:var(--muted);text-transform:uppercase}
.sgh2{display:grid;grid-template-columns:1.05fr 1fr;gap:34px;margin-top:28px}
.sga{display:grid;gap:14px}
.sga .rw{display:grid;grid-template-columns:240px 1fr 100px;gap:16px;align-items:center}
.sga .rw b{font:400 30px/1 Anton,sans-serif;text-transform:uppercase;color:var(--tc);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sga .rw .br{height:20px;border-radius:9px;background:rgba(255,255,255,.07);overflow:hidden}
.sga .rw .br i{display:block;height:100%;width:0;border-radius:9px;background:var(--tc);box-shadow:0 0 16px var(--tc);transition:width 1.4s cubic-bezier(.2,.8,.2,1)}
.sga .rw em{font:400 36px/1 Anton,sans-serif;color:#fff;font-style:normal;text-align:right}
.sgi{display:grid;gap:12px}
.sgi .it{padding:13px 18px;border-radius:14px;background:rgba(255,255,255,.05);box-shadow:inset 5px 0 0 var(--tc)}
.sgi .it div{display:flex;justify-content:space-between;font:700 14px "JetBrains Mono",monospace;letter-spacing:.08em;color:var(--tc);text-transform:uppercase}
.sgi .it div em{color:var(--muted);font-style:normal}
.sgi .it p{font:600 20px/1.35 Inter,sans-serif;color:#fff;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

/* next mission */
.sgm{display:grid;grid-template-columns:900px 1fr;gap:44px;align-items:start}
.sgm .shot{position:relative;aspect-ratio:16/9;border-radius:18px;overflow:hidden;border:3px solid #ffd23f;box-shadow:0 0 90px -16px rgba(255,210,63,.55);background:#000;transform:rotate(-1.2deg)}
.sgm .shot img{width:100%;height:100%;object-fit:cover;display:block}
.sgm .shot .tg{position:absolute;left:14px;top:14px;font:700 15px "JetBrains Mono",monospace;letter-spacing:.08em;padding:5px 10px;border-radius:6px;background:rgba(0,0,0,.75);color:#ffd23f}
.sgm .shot .nf{position:absolute;inset:0;display:grid;place-items:center;font:700 20px "JetBrains Mono",monospace;color:var(--muted);letter-spacing:.1em}
.sgm .stamp{position:absolute;right:18px;bottom:22px;transform:rotate(-9deg);font:400 46px/1 Anton,sans-serif;letter-spacing:.06em;color:#ff2d55;border:5px solid #ff2d55;padding:6px 18px 4px;border-radius:10px;background:rgba(12,0,6,.62);text-transform:uppercase;box-shadow:0 0 30px rgba(255,45,85,.4)}
.sgm .ob{display:grid;gap:16px}
.sgm .row{padding:16px 22px 18px;border-radius:16px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.1)}
.sgm .row span{font:700 15px "JetBrains Mono",monospace;letter-spacing:.16em;color:var(--muted);text-transform:uppercase}
.sgm .row b{display:block;font:400 40px/1.1 Anton,sans-serif;color:#fff;margin-top:6px;letter-spacing:.02em;text-transform:uppercase}
.sgm .row b.g{color:#7be07b}
.sgm .row p{font:600 22px/1.35 Inter,sans-serif;color:#fff;margin-top:6px}
.sgm .sts{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.sgm .sts .row b{font-size:36px}

/* what you missed */
.sgn{display:grid;gap:13px}
.sgn .it{display:grid;grid-template-columns:240px 1fr 140px;gap:24px;align-items:center;padding:16px 24px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);box-shadow:inset 6px 0 0 var(--tc)}
.sgn .it b{font:400 28px/1.05 Anton,sans-serif;text-transform:uppercase;color:var(--tc);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sgn .it p{font:600 23px/1.35 Inter,sans-serif;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sgn .it em{font:700 16px "JetBrains Mono",monospace;color:var(--muted);font-style:normal;text-align:right}

/* UP NEXT chip in the top bar */
.sg-next{display:flex;align-items:center;gap:12px;padding:7px 18px 7px 8px;border-radius:99px;background:rgba(255,210,63,.08);border:1px solid rgba(255,210,63,.42);white-space:nowrap;transition:background .4s,border-color .4s}
.sg-next svg{width:34px;height:34px;transform:rotate(-90deg);flex:none}
.sg-next svg circle{fill:none;stroke-width:4}
.sg-next .k{font:700 12px "JetBrains Mono",monospace;letter-spacing:.16em;color:#ffd23f;display:block}
.sg-next b{font:400 20px/1.05 Anton,sans-serif;letter-spacing:.05em;color:var(--ink);text-transform:uppercase;font-weight:400}
.sg-next em{font:700 16px "JetBrains Mono",monospace;font-style:normal;color:var(--muted);margin-left:2px}
.sg-next.air{background:rgba(255,45,85,.15);border-color:rgba(255,45,85,.6)}
.sg-next.air .k{color:#ff6b86}`;

  let S = null, dom = null, idx = 0, onAir = false, nextAt = 0, nextKind = TEST || ORDER[0], battleN = 0, timer = null, started = false;

  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = n => (n ?? 0).toLocaleString();
  const ago = iso => { if (!iso) return "—"; const d = (Date.now() - new Date(iso)) / 1000;
    return d < 45 ? "just now" : d < 3600 ? Math.floor(d / 60) + "m ago" : d < 86400 ? Math.floor(d / 3600) + "h ago" : Math.floor(d / 86400) + "d ago"; };
  const W = () => S.milestones.reduce((s, m) => s + m.weight, 0);
  const total = id => S.milestones.reduce((s, m) => s + (m.values[id] || 0) * m.weight, 0) / W();
  const ranked = () => [...S.teams].sort((a, b) => total(b.id) - total(a.id));
  const rankOf = id => 1 + S.teams.filter(x => total(x.id) > total(id) + 1e-9).length;
  const team = id => S.teams.find(t => t.id === id) || S.teams[0];
  const short = n => n.replace(/^team\s+/i, "");
  const feed = id => S.feeds?.[id] || {};
  const ladder = () => { const i = S.milestones.findIndex(m => m.name === "Playable"); return S.milestones.slice(0, i >= 0 ? i + 1 : S.milestones.length); };
  const cum = () => { let c = 0; const w = W(); return S.milestones.map(m => (c += m.weight) / w * 100); };
  function stepOf(id) { let reached = null, next = null;
    for (const m of ladder()) { if ((m.values[id] || 0) >= 100) reached = m; else { next = m; break; } } return { reached, next }; }
  const gainOf = id => { const n = stepOf(id).next; return n ? (100 - (n.values[id] || 0)) * n.weight / W() : 0; };
  const PHRASE = { "Exe runs": "run the game's own code", "First frame": "put the first frame on screen", "Main menu": "reach the main menu",
                   "In the world": "draw the first world frame", "Playable": "take control of a character" };
  const doWhat = id => { const n = stepOf(id).next; return n ? (PHRASE[n.name] || "clear " + n.name) : "play further"; };
  const fps = id => { const m = S.milestones.find(x => x.name === "Performance"); return m ? (m.values[id] || 0) * 0.3 : 0; };
  const lastActive = id => { const f = feed(id), ts = [...(f.commits || []).map(c => c.t), ...(f.pulls || []).map(p => p.t), ...S.events.filter(e => e.team === id).map(e => e.t)]
    .map(t => +new Date(t)).filter(Boolean); return ts.length ? new Date(Math.max(...ts)).toISOString() : null; };

  function ensureDom() {
    if (dom) return;
    const stage = document.getElementById("stage"); if (!stage) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const sg = document.createElement("div"); sg.className = "sg";
    sg.innerHTML = `<div class="sg-bg"></div><div class="sg-box"><div class="sg-h"><div class="sg-k"></div><div class="sg-t"></div><div class="sg-s"></div></div>
      <div class="sg-body"></div><div class="sg-f"><span>Up next: <b class="sg-nx"></b></span><div class="sg-bar"><i></i></div><span class="sg-src"></span></div></div><div class="sg-wipe"></div>`;
    stage.appendChild(sg);
    const chip = document.createElement("div"); chip.className = "sg-next";
    chip.innerHTML = `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,.14)"/><circle class="rg" cx="20" cy="20" r="16" stroke="#ffd23f" stroke-dasharray="100.5" stroke-dashoffset="0"/></svg>
      <div><span class="k">UP NEXT</span><b class="nm"></b> <em class="cd"></em></div>`;
    const right = stage.querySelector(".top .right"), onair = right?.querySelector(".onair");
    if (right) onair ? right.insertBefore(chip, onair) : right.prepend(chip);
    dom = { sg, chip, k: sg.querySelector(".sg-k"), t: sg.querySelector(".sg-t"), s: sg.querySelector(".sg-s"), body: sg.querySelector(".sg-body"),
            nx: sg.querySelector(".sg-nx"), src: sg.querySelector(".sg-src") };
    setInterval(tickChip, 1000);
  }

  /* ---------------- segments ---------------- */
  const SEG = {
    standings() {
      const R = ranked(), top = total(R[0].id), C = cum(), lad = ladder();
      const marks = lad.map((m, i) => `<u class="${m.name === "Playable" ? "pl" : ""}" style="left:${C[i]}%"></u>`).join("");
      return { title: "Race standings", sub: `${S.teams.length} crews · one public scale · <b>Playable = 50%</b>, the whole game = 100%`,
        body: `<div class="sgs">${R.map((t, i) => { const p = total(t.id), r = rankOf(t.id), st = stepOf(t.id);
          return `<div class="sgr in ${t.color} ${t.id === FOCUS ? "me" : ""} ${r === 1 ? "lead" : ""}" style="--d:${(.6 + i * .09).toFixed(2)}s">
            <b class="ps">${r}</b><span class="nm">${esc(short(t.name))}<small>${esc(t.tag || "")}</small></span>
            <span class="stp">${esc(st.reached ? st.reached.name : "Groundwork")}</span>
            <span class="br"><i data-w="${p.toFixed(2)}"></i>${marks}</span>
            <span class="pc">${p.toFixed(1)}<small>%</small></span><span class="gp">${r === 1 ? "LEADER" : "−" + (top - p).toFixed(1)}</span></div>`; }).join("")}</div>` };
    },
    battle() {
      const R = ranked(), pairs = [];
      for (let i = 0; i < R.length - 1; i++) pairs.push([R[i], R[i + 1], total(R[i].id) - total(R[i + 1].id)]);
      const mine = pairs.filter(p => p[0].id === FOCUS || p[1].id === FOCUS).sort((a, b) => a[2] - b[2]);
      const rest = pairs.filter(p => p[0].id !== FOCUS && p[1].id !== FOCUS).sort((a, b) => a[2] - b[2]);
      const pick = battleN++ % 2 === 0 ? mine[0] || rest[0] : rest[0] || mine[0]; if (!pick) return null;
      const [a, b, gap] = pick;
      const tie = gap < 0.05;
      const side = (t, cls) => { const f = feed(t.id), st = stepOf(t.id), n = st.next, la = lastActive(t.id);
        return `<div class="sd ${cls} ${t.color} up" style="--d:${cls === "l" ? ".7" : ".85"}s">
          <div class="rk">#${rankOf(t.id)} of ${S.teams.length}</div><div class="nm">${esc(short(t.name))}</div>
          <div class="pc">${total(t.id).toFixed(1)}<small>%</small></div>
          <div class="kv"><div>Furthest step<b>${esc(st.reached ? st.reached.name : "Groundwork")}</b></div>
            <div>${n ? "Working on" : "Frame rate"}<b>${n ? `${esc(n.name)} ${Math.round(n.values[t.id] || 0)}%` : `~${fps(t.id).toFixed(0)} fps`}</b></div>
            <div>Commits 24h<b>${fmt(f.commits24h || 0)}${f.commits24hCapped ? "+" : ""}</b></div><div>Last activity<b>${la ? ago(la) : "—"}</b></div></div>
          <div class="hl">${esc(t.headline || "")}</div></div>`; };
      const nb = stepOf(b.id).next, g = gainOf(b.id);
      const perf = S.milestones.find(m => m.name === "Performance"), perFps = perf ? perf.weight / W() * 100 / 30 : 0;
      const note = tie ? (nb ? `First to <b>${esc(doWhat(b.id))}</b> breaks the tie (+${g.toFixed(0)}%)` : `Every extra fps is worth <b>+${perFps.toFixed(1)}%</b> — one good optimisation decides it`)
        : nb ? `${esc(short(b.name))} needs to <b>${esc(doWhat(b.id))}</b> (+${g.toFixed(0)}%) to ${g > gap + 1e-9 ? "overtake" : g > gap - 1e-9 ? "draw level with" : "close in on"} ${esc(short(a.name))}`
        : `Only <b>${gap.toFixed(1)} points</b> apart — each extra fps is worth +${perFps.toFixed(1)}%`;
      return { title: tie ? "Dead heat" : "Battle watch", kicker: tie ? "level on points" : "closest fight on the board",
        sub: `<b>${esc(short(a.name))}</b> vs <b>${esc(short(b.name))}</b> · ${tie ? "level on points" : `separated by ${gap.toFixed(1)} points`}`,
        body: `<div class="sgb">${side(a, "l")}<div class="vs up" style="--d:.6s"><b>VS</b><span>${tie ? "Tied<br>" + total(a.id).toFixed(1) + "%" : "Gap<br>" + gap.toFixed(1) + " pts"}</span></div>${side(b, "r")}</div>
          <div class="sg-note up" style="--d:1.1s">${note}</div>` };
    },
    explain() {
      const C = cum(), lad = ladder(), R = ranked(), lead = R[0], me = team(FOCUS), pe = lad.length - 1;
      const cards = [
        ["1", `${S.teams.length} crews`, `are racing to get <em>GTA VI's Xbox build running on PC</em>, each with its own code.`],
        ["2", "One scale", `Every crew is scored on <em>PortWatch VI's public scale</em>: playable is 50%, the whole game finished is 100%.`],
        ["3", short(me.name), `is <em>our own port</em>. Its test runs, screenshots and crashes show up live on this stream.`],
        ["4", "Live from GitHub", `Every commit and pull request from every crew lands in the <em>crew chat</em> as it happens.`],
      ];
      const marker = t => `<div class="mk ${t.color}" data-l="${total(t.id).toFixed(2)}"><b>${esc(short(t.name))} ${total(t.id).toFixed(1)}%</b></div>`;
      return { title: "New here?", kicker: "the race in 15 seconds", sub: `Welcome — here's what you're watching`,
        body: `<div class="sge">${cards.map((c, i) => `<div class="cd up" style="--d:${(.7 + i * .15).toFixed(2)}s"><i>${c[0]}</i><b>${esc(c[1])}</b><span>${c[2]}</span></div>`).join("")}</div>
          <div class="sgl up" style="--d:1.3s"><div class="tr"></div>${pe < S.milestones.length - 1 ? `<div class="well" style="left:${C[pe]}%"></div>` : ""}
            ${lad.map((m, i) => `<div class="cp ${m.name === "Playable" ? "pl" : ""}" style="left:${C[i]}%"><i></i><span>${esc(m.name)}<small>${Math.round(C[i])}%</small></span></div>`).join("")}
            <div class="cp pl" style="left:100%"><i></i><span>Whole game<small>100%</small></span></div>
            ${marker(lead)}${lead.id !== me.id ? marker(me) : ""}</div>
          <div class="sg-cta up" style="--d:1.6s">🔔 <b>Subscribe</b> to catch ${esc(short(me.name))}'s first world frame live</div>` };
    },
    mission() {
      const L = team(FOCUS), st = stepOf(FOCUS), p = total(FOCUS), g = gainOf(FOCUS), np = p + g;
      const others = S.teams.filter(x => x.id !== FOCUS);
      const passes = others.filter(x => total(x.id) >= p - 1e-9 && total(x.id) < np - 1e-9), ties = others.filter(x => Math.abs(total(x.id) - np) < 1e-9);
      const newRank = 1 + others.filter(x => total(x.id) > np + 1e-9).length;
      const reward = st.next ? `+${g.toFixed(0)}% → ${np.toFixed(1)}%` : "keep climbing";
      const rewardSub = [passes.length ? "passes " + passes.map(x => short(x.name)).join(", ") : "", ties.length ? "ties " + ties.map(x => short(x.name)).join(", ") : "", st.next ? `up to #${newRank}` : ""].filter(Boolean).join(" · ");
      const B = S.live?.bench; let src = null, tag = "";
      if (B && !B.imagesHidden) { const fr = B.frame, shot = B.shot, enc = encodeURIComponent;
        if (fr && fr.kind === "image") { src = STATIC() ? "frame.png?t=" + enc(fr.t) : "/api/frame?t=" + enc(fr.t); tag = "LIVE FRAME"; }
        else if (shot) { src = STATIC() ? "shot.png?t=" + enc(shot.t) : "/api/shot?t=" + enc(shot.t); tag = "LATEST SCREENSHOT · " + ago(shot.t).toUpperCase(); } }
      const r = B?.latestRun, b0 = B?.builds?.[0];
      return { title: "Next mission", kicker: `${short(L.name)} · our port`, sub: `Objective: <b>${esc(doWhat(FOCUS))}</b>`,
        body: `<div class="sgm"><div class="shot up" style="--d:.7s">${src ? `<img src="${src}" alt="">` : `<div class="nf">NO SCREENSHOT YET</div>`}${tag ? `<span class="tg">${tag}</span>` : ""}
            ${st.next ? `<div class="stamp">${esc(st.next.name)}: not yet</div>` : ""}</div>
          <div class="ob"><div class="row in" style="--d:.85s"><span>Reward</span><b class="g">${reward}</b>${rewardSub ? `<p>${esc(rewardSub)}</p>` : ""}</div>
            <div class="row in" style="--d:1s"><span>Where it stands</span><p>${esc(L.headline || "")}</p></div>
            <div class="sts"><div class="row up" style="--d:1.15s"><span>Test runs today</span><b>${fmt(B?.runsToday ?? 0)}</b></div>
              <div class="row up" style="--d:1.25s"><span>Longest run</span><b>${B?.bestToday ? fmt(B.bestToday.frames) : "—"}</b></div>
              <div class="row up" style="--d:1.35s"><span>Latest run</span><b>${r ? (r.crashed ? "crashed" : r.running ? "running" : "ended") : "—"}</b></div></div>
            <div class="row in" style="--d:1.45s"><span>Builds</span><b>${b0 ? `#${b0.n} ${b0.failed ? "✗" : "✓"} · ${ago(b0.t)}` : "—"}</b></div></div></div>` };
    },
    hour() {
      const now = Date.now(), H = 3600e3, act = {};
      let win = "hour";
      const count = span => { let c = 0, m = 0, e = 0, crews = 0;
        for (const t of S.teams) { const f = feed(t.id);
          const tc = span === "hour" ? ((f.activity24 || [])[23] ?? (f.commits || []).filter(x => now - new Date(x.t) < H).length) : (f.commits24h || 0);
          act[t.id] = tc; c += tc;
          m += (f.pulls || []).filter(p => p.state === "merged" && now - new Date(p.t) < (span === "hour" ? H : 24 * H)).length;
          const te = S.events.filter(x => x.team === t.id && now - new Date(x.t) < (span === "hour" ? H : 24 * H)).length; e += te;
          if (tc || te) crews++; }
        return { c, m, e, crews }; };
      let n = count("hour"); if (n.c < 3) { win = "day"; n = count("day"); }
      const top = [...S.teams].sort((a, b) => act[b.id] - act[a.id]).slice(0, 5), mx = Math.max(1, ...top.map(t => act[t.id]));
      const span = win === "hour" ? H : 24 * H, items = [];
      for (const t of S.teams) { for (const p of feed(t.id).pulls || []) if (p.state === "merged" && now - new Date(p.t) < span) items.push({ t, when: p.t, text: p.title, k: "merged" }); }
      for (const e of S.events) if (now - new Date(e.t) < span) items.push({ t: team(e.team), when: e.t, text: e.text, k: "update" });
      items.sort((a, b) => new Date(b.when) - new Date(a.when));
      const ct = (v, k, cls, d) => `<div class="ct up ${cls}" style="--d:${d}s"><b data-n="${v}">0</b><span>${k}</span></div>`;
      return { title: win === "hour" ? "The last hour" : "The last 24 hours", kicker: "across every crew", sub: win === "hour" ? `What all ${S.teams.length} crews shipped in the last 60 minutes` : `A quiet hour — here's the whole day instead`,
        body: `<div class="sgh">${ct(n.c, "Commits", "g", .7)}${ct(n.m, "PRs merged", "", .8)}${ct(n.e, "Dev updates", "", .9)}${ct(n.crews, "Crews active", "", 1)}</div>
          <div class="sgh2"><div><div class="sg-lbl">Busiest crews</div><div class="sga">${top.map((t, i) => `<div class="rw in ${t.color}" style="--d:${(1.1 + i * .1).toFixed(2)}s"><b>${esc(short(t.name))}</b><div class="br"><i data-w="${(act[t.id] / mx * 100).toFixed(1)}"></i></div><em>${fmt(act[t.id])}</em></div>`).join("")}</div></div>
            <div><div class="sg-lbl">Latest moves</div><div class="sgi">${items.slice(0, 4).map((x, i) => `<div class="it in ${x.t.color}" style="--d:${(1.2 + i * .1).toFixed(2)}s"><div>${esc(short(x.t.name))} · ${x.k}<em>${ago(x.when)}</em></div><p>${esc(x.text)}</p></div>`).join("") || `<div class="sg-note">Nothing merged yet — the crews are heads-down.</div>`}</div></div></div>` };
    },
    news() {
      const evs = [...S.events].sort((a, b) => new Date(b.t) - new Date(a.t)).slice(0, 6);
      return { title: "What you missed", kicker: "dev updates and race news", sub: `The latest from the crews — catch up in 15 seconds`,
        body: `<div class="sgn">${evs.map((e, i) => { const t = team(e.team);
          return `<div class="it in ${t.color}" style="--d:${(.7 + i * .1).toFixed(2)}s"><b>${esc(short(t.name))}</b><p>${esc(e.text)}</p><em>${ago(e.t)}</em></div>`; }).join("")}</div>` };
    },
  };

  /* ---------------- running a segment ---------------- */
  function countUp(el) {
    const to = +el.dataset.n || 0, t0 = performance.now(), dur = 1500;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4); el.textContent = fmt(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step); setTimeout(() => el.textContent = fmt(to), dur + 120);
  }
  function show(kind) {
    const seg = SEG[kind]?.(); if (!seg) return false;
    dom.k.innerHTML = `<i></i>${esc((seg.kicker || "live segment").toUpperCase())}`;
    dom.t.textContent = seg.title; dom.s.innerHTML = seg.sub || ""; dom.body.innerHTML = seg.body;
    const upcoming = TEST || ORDER[(idx + 1) % ORDER.length];
    dom.nx.textContent = NAME[upcoming]; dom.src.textContent = S.scale ? "scores: PortWatch VI scale" : "";
    const sg = dom.sg; sg.classList.remove("show"); void sg.offsetWidth; sg.classList.add("show");
    setTimeout(() => {
      sg.querySelectorAll("[data-w]").forEach(i => i.style.width = i.dataset.w + "%");
      sg.querySelectorAll("[data-n]").forEach(countUp);
      sg.querySelectorAll(".sgl .mk").forEach(m => m.style.left = m.dataset.l + "%");
    }, 700);
    return true;
  }
  const busyElsewhere = () => document.hidden || !!document.querySelector(".mission.show,.eg-cel.show,.eg-cta.show") || !!window.Engage?.busy?.();
  function plan(ms) { clearTimeout(timer); nextAt = Date.now() + ms; timer = setTimeout(tryRun, ms); tickChip(); }
  function tryRun() {
    if (!S || !dom) return plan(3000);
    if (busyElsewhere()) return plan(4000);
    run(nextKind);
  }
  function run(kind) {
    if (!S || !dom || onAir) return;
    if (!show(kind)) { idx++; nextKind = TEST || ORDER[idx % ORDER.length]; return plan(1000); }
    onAir = true; tickChip();
    setTimeout(() => {
      dom.sg.classList.remove("show"); onAir = false;
      idx++; nextKind = TEST || ORDER[idx % ORDER.length];
      if (TEST) plan(3500); else if (EVERY) plan(Math.max(20e3, EVERY - HOLD)); else { nextAt = 0; tickChip(); }
    }, HOLD);
  }
  function tickChip() {
    if (!dom) return;
    const c = dom.chip, ring = c.querySelector(".rg");
    c.style.display = EVERY || TEST ? "" : "none";
    if (onAir) { c.classList.add("air"); c.querySelector(".k").textContent = "ON AIR NOW"; c.querySelector(".nm").textContent = NAME[nextKind]; c.querySelector(".cd").textContent = ""; ring.style.strokeDashoffset = 0; return; }
    c.classList.remove("air"); c.querySelector(".k").textContent = "UP NEXT";
    c.querySelector(".nm").textContent = NAME[nextKind] || "";
    const left = Math.max(0, nextAt - Date.now()), span = Math.max(1, EVERY - HOLD || 60e3);
    c.querySelector(".cd").textContent = nextAt ? `${Math.floor(left / 60e3)}:${String(Math.floor(left / 1000) % 60).padStart(2, "0")}` : "";
    ring.style.strokeDashoffset = (100.5 * Math.min(1, left / span)).toFixed(1);
  }

  window.Segments = {
    update(state) {
      S = state; ensureDom(); if (!dom) return;
      if (!started) { started = true; plan(TEST ? 1500 : STATIC() ? 25e3 : 75e3); }
    },
    run(kind) { if (SEG[kind] && !onAir) { nextKind = kind; clearTimeout(timer); run(kind); } },
    onAir: () => onAir,
  };
})();
