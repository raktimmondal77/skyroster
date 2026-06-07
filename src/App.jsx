import { useState, useEffect, useCallback, useMemo } from "react";

/* ────────── GLOBAL STYLES ────────── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Sora:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'DM Sans',system-ui,sans-serif}
    .mono{font-family:'JetBrains Mono',monospace}
    .sora{font-family:'Sora',sans-serif}
    :focus-visible{outline:2px solid #2563EB;outline-offset:2px;border-radius:8px}
    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:99px}
    [data-dark] ::-webkit-scrollbar-thumb{background:#334155}
    input[type=date]::-webkit-calendar-picker-indicator,
    input[type=time]::-webkit-calendar-picker-indicator{opacity:.5;cursor:pointer}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
    @keyframes slideR{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)}50%{box-shadow:0 0 0 6px rgba(37,99,235,0)}}
    .anim-fade-up{animation:fadeUp .4s cubic-bezier(.22,.68,0,1.2) forwards}
    .anim-scale{animation:scaleIn .25s cubic-bezier(.22,.68,0,1.2) forwards}
    .anim-slide-r{animation:slideR .3s ease forwards}
    .nav-item{transition:all .2s ease}
    .nav-item:hover{transform:translateX(3px)}
    .card-lift{transition:transform .25s cubic-bezier(.22,.68,0,1.2),box-shadow .25s ease}
    .card-lift:hover{transform:translateY(-4px)}
    .row-hover:hover{background:rgba(37,99,235,.035)!important}
    [data-dark] .row-hover:hover{background:rgba(255,255,255,.04)!important}
    .btn-hover{transition:all .18s ease}
    .btn-hover:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 6px 18px rgba(37,99,235,.32)}
    .shift-pill{transition:all .15s ease}
    .shift-pill:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.12)}
    .sidebar-el{transition:transform .28s cubic-bezier(.4,0,.2,1)}
    @media(min-width:768px){.sidebar-el{transform:translateX(0)!important}}
    @media(max-width:767px){.mob-ham{display:flex!important}.desk-only{display:none!important}.hide-mob{display:none!important}}
    .gradient-text{background:linear-gradient(135deg,#2563EB 0%,#7C3AED 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .glass{backdrop-filter:blur(16px) saturate(140%)}
    .roster-table-wrap{font-size:13px}
    @media(max-width:767px){.roster-table-wrap{font-size:11px}}
  `}</style>
);

/* ────────── CONSTANTS ────────── */
const DEFAULT_SHIFTS = [
  { id:"s1", code:"M1", title:"Morning Shift", start:"06:00", end:"14:30", color:"#2563EB", isOff:false },
  { id:"s2", code:"M2", title:"Mid Shift",     start:"09:00", end:"17:30", color:"#7C3AED", isOff:false },
  { id:"s3", code:"E",  title:"Evening Shift", start:"14:00", end:"22:30", color:"#D97706", isOff:false },
  { id:"s4", code:"N",  title:"Night Shift",   start:"20:30", end:"05:00", color:"#DC2626", isOff:false },
  { id:"s5", code:"F",  title:"Off Day",       start:"",      end:"",      color:"#059669", isOff:true  },
];
const DAYS_FULL  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const NAV_ITEMS  = [
  { id:"dashboard", label:"Dashboard",    icon:"◫" },
  { id:"roster",    label:"Roster",       icon:"≡" },
  { id:"shifts",    label:"Shift Config", icon:"◎" },
  { id:"export",    label:"Export",       icon:"↑" },
  { id:"settings",  label:"Settings",     icon:"⚙" },
];
const STORE_VERSION = 3;

/* ────────── HELPERS ────────── */
const fmtDate = d => {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};
const genDates = (s,e) => {
  const out=[], cur=new Date(s+"T00:00:00"), end=new Date(e+"T00:00:00");
  while(cur<=end){ out.push(fmtDate(cur)); cur.setDate(cur.getDate()+1); }
  return out;
};
const dayFull  = ds => DAYS_FULL[new Date(ds+"T00:00:00").getDay()];
const dayShort = ds => DAYS_SHORT[new Date(ds+"T00:00:00").getDay()];
const todayStr = () => fmtDate(new Date());
const isON = (s,e) => { if(!s||!e) return false; const[sh,sm]=s.split(":").map(Number),[eh,em]=e.split(":").map(Number); return eh<sh||(eh===sh&&em<sm); };
const calcHrs = (s,e) => { if(!s||!e) return 0; const[sh,sm]=s.split(":").map(Number),[eh,em]=e.split(":").map(Number); let h=(eh+em/60)-(sh+sm/60); if(h<0)h+=24; return h; };
const fmtDayFull = ds => new Date(ds+"T00:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"});

/* RFC5545 text escaping */
const esc = (v="") => String(v).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");

/* ────────── PATTERN DETECTION ──────────
   Looks at assigned shift codes in date order, finds the shortest
   cycle length (2..14) that repeats consistently across >=2 full cycles. */
const detectPattern = roster => {
  const seq = roster.map(r => r.shift || null);
  const assigned = seq.filter(Boolean);
  if (assigned.length < 4) return null;
  // Work on the leading contiguous assigned block (manual input at the top).
  let lead = [];
  for (const code of seq){ if(!code) break; lead.push(code); }
  if (lead.length < 4) return null;
  for (let len=2; len<=Math.min(14, Math.floor(lead.length/2)); len++){
    const base = lead.slice(0,len);
    let ok = true;
    for (let i=len; i<lead.length; i++){ if(lead[i]!==base[i%len]){ ok=false; break; } }
    if (ok) return base; // shortest valid cycle
  }
  return null;
};

const applyPattern = (roster, cycle) => {
  if(!cycle || !cycle.length) return roster;
  // anchor on first assigned day so the phase stays aligned
  const firstIdx = roster.findIndex(r => r.shift);
  if (firstIdx < 0) return roster;
  return roster.map((r,i) => {
    if (r.shift) return r;            // never overwrite manual entries
    if (i < firstIdx) return r;
    return { ...r, _pendingShift: cycle[(i-firstIdx)%cycle.length] };
  });
};

/* ────────── ICS ────────── */
const buildICS = (roster,shifts) => {
  const fi = d => d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Smart Shift Roster Planner//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Smart Shift Roster"];
  roster.forEach(r=>{
    if(!r.shift) return;
    const sh=shifts.find(s=>s.code===r.shift);
    if(!sh||sh.isOff||!r.startTime||!r.endTime) return;
    const[sH,sM]=r.startTime.split(":").map(Number),[eH,eM]=r.endTime.split(":").map(Number);
    const ds=new Date(r.date+"T00:00:00"); ds.setHours(sH,sM,0,0);
    const de=new Date(r.date+"T00:00:00"); if(isON(r.startTime,r.endTime)) de.setDate(de.getDate()+1); de.setHours(eH,eM,0,0);
    const uid=`${r.date}-${r.shift}@ssrp`;
    lines.push("BEGIN:VEVENT",`UID:${uid}`,`DTSTAMP:${fi(new Date())}`,`DTSTART:${fi(ds)}`,`DTEND:${fi(de)}`,`SUMMARY:${esc(r.eventTitle||sh.title)}`);
    if(r.location) lines.push(`LOCATION:${esc(r.location)}`);
    if(r.notes)    lines.push(`DESCRIPTION:${esc(r.notes)}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
};
const downloadICS = (roster,shifts) => {
  const blob=new Blob([buildICS(roster,shifts)],{type:"text/calendar;charset=utf-8"});
  const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download="smart-shift-roster.ics"; a.click(); URL.revokeObjectURL(url);
};

/* ────────── THEME ────────── */
const T = d => ({
  bg:d?"#070D1A":"#EEF2FB", sidebar:d?"#0C1322":"#FFFFFF", sBdr:d?"#1C2740":"#E6ECF6",
  card:d?"#0D1526":"#FFFFFF", cardBdr:d?"#1C2740":"#E8EDF7", cardHov:d?"#121C32":"#F6F9FF",
  glass:d?"rgba(13,21,38,.6)":"rgba(255,255,255,.6)",
  text:d?"#EAF0FF":"#0A1628", sub:d?"#7488AE":"#5A6E92",
  inputBg:d?"#060C18":"#FFFFFF", inputBdr:d?"#26314F":"#D0D9EA", inputTxt:d?"#EAF0FF":"#0A1628",
  tHead:d?"#060C18":"#F4F7FF", tBdr:d?"#19243A":"#ECF0FA", tag:d?"#19243A":"#EEF2FF", is:d,
});

/* ────────── PRIMITIVES ────────── */
const Input = ({ t, style, ...p }) => (
  <input {...p} style={{ width:"100%", padding:"9px 13px", borderRadius:10, border:`1.5px solid ${t.inputBdr}`, background:t.inputBg, color:t.inputTxt, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", transition:"border-color .15s", ...style }}
    onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor=t.inputBdr} />
);
const TinyInput = ({ t, style, ...p }) => (
  <input {...p} style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${t.inputBdr}`, background:t.inputBg, color:t.inputTxt, fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", ...style }}
    onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor=t.inputBdr} />
);
const Btn = ({ children, variant="primary", disabled, onClick, style, size="md", ...rest }) => {
  const pads={ sm:"6px 14px", md:"10px 22px", lg:"13px 28px" };
  const vars={ primary:{background:"#2563EB",color:"#fff",border:"none"}, ghost:{background:"transparent",color:"#5A6E92",border:"1.5px solid #D0D9EA"}, danger:{background:"transparent",color:"#EF4444",border:"1.5px solid #FCA5A5"}, success:{background:"#059669",color:"#fff",border:"none"} };
  return (
    <button disabled={disabled} onClick={onClick} className="btn-hover" {...rest} style={{ display:"inline-flex", alignItems:"center", gap:7, padding:pads[size], borderRadius:11, fontSize:13, fontWeight:600, cursor:disabled?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", opacity:disabled?.42:1, ...vars[variant], ...style }}>{children}</button>
  );
};
/* ────────── SIDEBAR ────────── */
function Sidebar({ view, setView, dark, setDark, t, open, setOpen }) {
  return (
    <>
      {open && <div onClick={()=>setOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:90, backdropFilter:"blur(4px)" }} />}
      <aside className="sidebar-el" style={{ position:"fixed", top:0, left:0, bottom:0, width:248, background:t.sidebar, borderRight:`1px solid ${t.sBdr}`, display:"flex", flexDirection:"column", zIndex:100, transform:open?"translateX(0)":"translateX(-100%)" }}>
        <div style={{ padding:"22px 22px 18px", borderBottom:`1px solid ${t.sBdr}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:13, background:"linear-gradient(135deg,#2563EB,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 18px rgba(37,99,235,.35)" }}>
              <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:20, color:"#fff" }}>S</span>
            </div>
            <div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:14, color:t.text, letterSpacing:"-0.3px" }}>Smart Shift</div>
              <div style={{ fontSize:10, color:t.sub, marginTop:1, textTransform:"uppercase", letterSpacing:1.2, fontWeight:600 }}>Roster Planner</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"14px 12px 0" }}>
          {NAV_ITEMS.map(n=>{
            const active=view===n.id;
            return (
              <button key={n.id} className="nav-item" aria-current={active?"page":undefined} onClick={()=>{setView(n.id);setOpen(false);}} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:12, border:"none", cursor:"pointer", background:active?(t.is?"rgba(37,99,235,.18)":"#EFF6FF"):"transparent", color:active?"#2563EB":t.sub, fontSize:13, fontWeight:active?700:500, marginBottom:3, fontFamily:"'DM Sans',sans-serif", textAlign:"left", boxShadow:active?"inset 3px 0 0 #2563EB":"none" }}>
                <span aria-hidden style={{ fontSize:17, lineHeight:1, opacity:active?1:.65 }}>{n.icon}</span>
                {n.label}
                {active && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:"#2563EB" }} />}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"14px 12px 22px", borderTop:`1px solid ${t.sBdr}`, marginTop:12 }}>
          <button className="nav-item" role="switch" aria-checked={dark} aria-label="Toggle dark mode" onClick={()=>setDark(!dark)} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:12, border:"none", cursor:"pointer", background:"transparent", color:t.sub, fontSize:13, fontWeight:600, fontFamily:"'DM Sans',sans-serif", textAlign:"left" }}>
            <span aria-hidden style={{ fontSize:17 }}>{dark?"☀":"🌙"}</span>
            {dark?"Light Mode":"Dark Mode"}
            <div aria-hidden style={{ marginLeft:"auto", width:36, height:20, borderRadius:10, background:dark?"#2563EB":"#CBD5E1", position:"relative", flexShrink:0, transition:"background .2s" }}>
              <div style={{ position:"absolute", top:3, width:14, height:14, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.2)", transform:dark?"translateX(19px)":"translateX(3px)", transition:"transform .2s" }} />
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}

/* ────────── HEADER ────────── */
function Header({ t, roster, shifts, mobOpen, setMobOpen }) {
  const today=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const canExport=roster.some(r=>r.shift&&r.shift!=="F"&&r.startTime);
  return (
    <header className="glass" style={{ position:"sticky", top:0, zIndex:50, background:t.is?"rgba(7,13,26,.82)":"rgba(238,242,251,.85)", borderBottom:`1px solid ${t.sBdr}`, padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <button className="mob-ham" aria-label="Open navigation menu" aria-expanded={mobOpen} onClick={()=>setMobOpen(!mobOpen)} style={{ display:"none", alignItems:"center", background:"none", border:"none", cursor:"pointer", color:t.sub, fontSize:22, padding:"2px" }}>☰</button>
        <div>
          <div className="sora desk-only" style={{ fontSize:17, fontWeight:700, color:t.text, letterSpacing:"-0.4px" }}>Smart Shift Dashboard</div>
          <div style={{ fontSize:12, color:t.sub, fontWeight:500, marginTop:1 }}>{today}</div>
        </div>
      </div>
      <button disabled={!canExport} aria-label="Export calendar as ICS" onClick={()=>downloadICS(roster,shifts)} className="btn-hover" style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 22px", borderRadius:11, border:"none", cursor:canExport?"pointer":"not-allowed", background:canExport?"linear-gradient(135deg,#2563EB,#7C3AED)":"#CBD5E1", color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'DM Sans',sans-serif", boxShadow:canExport?"0 4px 14px rgba(37,99,235,.35)":"none", opacity:canExport?1:.6 }}>
        <span aria-hidden>📅</span> Export .ics
      </button>
    </header>
  );
}

/* ────────── DASHBOARD (dense bento grid) ────────── */
function DashboardView({ t, roster, shifts, setView }) {
  const today=todayStr();
  const { work, night, off, totalH, upcoming, weekStrip } = useMemo(()=>{
    const work=roster.filter(r=>r.shift&&r.shift!=="F"&&r.startTime);
    const night=roster.filter(r=>r.shift==="N");
    const off=roster.filter(r=>r.shift==="F"||!r.shift);
    const totalH=work.reduce((a,r)=>a+calcHrs(r.startTime,r.endTime),0);
    const upcoming=roster.filter(r=>r.date>=today&&r.shift&&r.shift!=="F").slice(0,5);
    // next 7 days strip
    const base=new Date(today+"T00:00:00");
    const weekStrip=Array.from({length:7},(_,i)=>{ const d=new Date(base); d.setDate(d.getDate()+i); const ds=fmtDate(d); return { ds, row:roster.find(r=>r.date===ds) }; });
    return { work, night, off, totalH, upcoming, weekStrip };
  },[roster,today]);

  const next=upcoming[0];
  const nextSh=next?shifts.find(s=>s.code===next.shift):null;
  const hr=new Date().getHours();
  const greet=hr<12?"Good morning":hr<18?"Good afternoon":"Good evening";

  const breakdown=useMemo(()=>{
    const b=shifts.filter(s=>!s.isOff).map(s=>({ ...s, count:roster.filter(r=>r.shift===s.code&&r.startTime).length })).filter(s=>s.count>0);
    const max=Math.max(...b.map(s=>s.count),1);
    return { b, max };
  },[shifts,roster]);

  const stats=[
    { label:"Scheduled", val:work.length, icon:"📋", clr:"#2563EB", bg:t.is?"rgba(37,99,235,.15)":"#EFF6FF" },
    { label:"Night Ops", val:night.length, icon:"🌙", clr:"#7C3AED", bg:t.is?"rgba(124,58,237,.15)":"#F5F3FF" },
    { label:"Rest Days", val:off.length, icon:"🏖", clr:"#059669", bg:t.is?"rgba(5,150,105,.15)":"#ECFDF5" },
    { label:"Hours", val:totalH.toFixed(1), icon:"⏱", clr:"#D97706", bg:t.is?"rgba(217,119,6,.15)":"#FFFBEB" },
  ];

  const card={ background:t.card, border:`1px solid ${t.cardBdr}`, borderRadius:22, boxShadow:"0 2px 14px rgba(0,0,0,.04)" };

  return (
    <div className="anim-fade-up" style={{ display:"flex", flexDirection:"column", gap:20, width:"100%" }}>
      {/* Greeting */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
        <div>
          <div className="sora" style={{ fontSize:30, fontWeight:900, color:t.text, letterSpacing:"-0.8px" }}>{greet}, <span className="gradient-text">Planner.</span></div>
          <div style={{ fontSize:14, color:t.sub, marginTop:6 }}>Your workforce schedule at a glance.</div>
        </div>
        <Btn onClick={()=>setView("roster")} variant="ghost" style={{ border:`1.5px solid ${t.cardBdr}`, color:t.sub }}>Open Roster →</Btn>
      </div>

      {/* BENTO GRID — fills width at every breakpoint */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gridAutoRows:"minmax(10px,auto)", gap:18 }}>

        {/* Hero next-shift — spans 8 */}
        {next ? (
          <div className="card-lift" style={{ gridColumn:"span 8", borderRadius:24, padding:"30px 34px", position:"relative", overflow:"hidden", background:`linear-gradient(135deg, ${nextSh?.color||"#2563EB"} 0%, #0A1024 100%)`, boxShadow:`0 16px 40px -12px ${nextSh?.color||"#2563EB"}66`, minWidth:0 }}>
            <div style={{ position:"absolute", top:"-30%", right:"-8%", width:340, height:340, background:"rgba(255,255,255,.07)", borderRadius:"50%", filter:"blur(40px)" }} />
            <div style={{ position:"relative", zIndex:1, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 12px #4ADE80", animation:"pulse 2s infinite" }} />
                  <span style={{ fontSize:11, textTransform:"uppercase", letterSpacing:2, color:"rgba(255,255,255,.75)", fontWeight:700 }}>Next Operational Shift</span>
                </div>
                <div className="sora" style={{ fontSize:34, fontWeight:900, color:"#fff", letterSpacing:"-0.8px", marginBottom:8 }}>{nextSh?.title||"Upcoming"}</div>
                <div style={{ fontSize:15, color:"rgba(255,255,255,.85)", fontWeight:500 }}>
                  {fmtDayFull(next.date)}
                  {next.startTime && <> &nbsp;·&nbsp; <strong style={{ color:"#fff" }}>{next.startTime} – {next.endTime}</strong> {isON(next.startTime,next.endTime)&&"🌙"}</>}
                </div>
              </div>
              <div className="glass" style={{ background:"rgba(255,255,255,.12)", padding:"18px 30px", borderRadius:20, textAlign:"center", border:"1px solid rgba(255,255,255,.2)" }}>
                <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:1.5, color:"rgba(255,255,255,.65)", marginBottom:4, fontWeight:600 }}>Code</div>
                <div className="sora" style={{ fontSize:44, fontWeight:900, color:"#fff", lineHeight:1 }}>{next.shift}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...card, gridColumn:"span 8", padding:"40px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
            <div style={{ fontSize:42, marginBottom:12 }}>📭</div>
            <div style={{ fontWeight:800, color:t.text, fontSize:16 }} className="sora">No upcoming shifts</div>
            <div style={{ color:t.sub, fontSize:13, marginTop:4 }}>Generate your roster to populate the dashboard.</div>
            <Btn onClick={()=>setView("roster")} style={{ marginTop:16 }}>Generate Roster →</Btn>
          </div>
        )}

        {/* 2x2 stat cluster — spans 4 */}
        <div style={{ gridColumn:"span 4", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {stats.map((s,i)=>(
            <div key={i} className="card-lift" style={{ ...card, padding:"18px 18px", position:"relative", overflow:"hidden" }}>
              <div aria-hidden style={{ position:"absolute", top:-16, right:-6, fontSize:62, opacity:.05, transform:"rotate(10deg)" }}>{s.icon}</div>
              <div style={{ width:38, height:38, borderRadius:12, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, marginBottom:12 }} aria-hidden>{s.icon}</div>
              <div className="sora" style={{ fontSize:24, fontWeight:900, color:t.text, lineHeight:1, letterSpacing:"-0.5px" }}>{s.val}</div>
              <div style={{ fontSize:10.5, color:t.sub, marginTop:6, fontWeight:700, textTransform:"uppercase", letterSpacing:.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Week strip — spans 12 */}
        <div style={{ ...card, gridColumn:"span 12", padding:"20px 24px" }}>
          <div style={{ fontSize:12, fontWeight:700, color:t.sub, textTransform:"uppercase", letterSpacing:.8, marginBottom:14 }}>Next 7 Days</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10 }}>
            {weekStrip.map(({ds,row},i)=>{
              const sh=row?.shift?shifts.find(s=>s.code===row.shift):null;
              const isToday=ds===today;
              return (
                <div key={i} style={{ borderRadius:14, padding:"12px 10px", textAlign:"center", border:`1px solid ${isToday?"#2563EB":t.cardBdr}`, background:sh?`${sh.color}14`:t.cardHov, position:"relative" }}>
                  {isToday && <div style={{ position:"absolute", top:6, right:8, fontSize:8, fontWeight:800, color:"#2563EB", textTransform:"uppercase" }}>Today</div>}
                  <div style={{ fontSize:10, fontWeight:700, color:t.sub, textTransform:"uppercase" }}>{dayShort(ds)}</div>
                  <div className="sora" style={{ fontSize:16, fontWeight:800, color:t.text, margin:"2px 0 6px" }}>{ds.slice(8)}</div>
                  {sh ? <div style={{ display:"inline-block", padding:"2px 8px", borderRadius:8, fontSize:10, fontWeight:800, background:sh.color, color:"#fff" }}>{sh.code}</div>
                      : <div style={{ fontSize:11, color:t.sub, opacity:.5 }}>—</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming timeline — spans 7 */}
        <div style={{ ...card, gridColumn:"span 7", padding:"24px 26px", minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div className="sora" style={{ fontSize:16, fontWeight:800, color:t.text }}>Upcoming Timeline</div>
            <button onClick={()=>setView("roster")} style={{ background:"none", border:"none", cursor:"pointer", color:"#2563EB", fontSize:12, fontWeight:700 }}>View roster →</button>
          </div>
          {upcoming.length===0 ? (
            <div style={{ color:t.sub, fontSize:13, padding:"20px 0", textAlign:"center" }}>No upcoming shifts scheduled.</div>
          ) : (
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", top:20, bottom:20, left:22, width:2, background:`linear-gradient(to bottom,#2563EB,${t.cardBdr})` }} />
              {upcoming.map((r,i)=>{
                const sh=shifts.find(s=>s.code===r.shift); const ov=isON(r.startTime,r.endTime);
                return (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:16, position:"relative", zIndex:1, paddingBottom:i!==upcoming.length-1?18:0 }}>
                    <div style={{ width:46, height:46, borderRadius:"50%", background:t.card, border:`2.5px solid ${sh?.color||"#2563EB"}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 0 0 5px ${t.card}` }}>
                      <div style={{ fontSize:9, fontWeight:700, color:t.sub, textTransform:"uppercase" }}>{dayShort(r.date)}</div>
                      <div style={{ fontSize:14, fontWeight:800, color:t.text, lineHeight:1 }}>{r.date.slice(8)}</div>
                    </div>
                    <div style={{ flex:1, background:t.cardHov, padding:"12px 16px", borderRadius:14, border:`1px solid ${t.cardBdr}`, minWidth:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                        <div style={{ fontWeight:700, fontSize:13, color:t.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.eventTitle||sh?.title||r.shift}</div>
                        <div style={{ background:`${sh?.color||"#2563EB"}22`, color:sh?.color||"#2563EB", padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:800, flexShrink:0 }}>{r.shift}</div>
                      </div>
                      {r.startTime && <div style={{ fontSize:11, color:t.sub, marginTop:5, fontWeight:500 }}>🕒 {r.startTime} → {r.endTime} {ov?"🌙":""}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Distribution + profiles — spans 5 */}
        <div style={{ ...card, gridColumn:"span 5", padding:"24px 26px", minWidth:0 }}>
          <div className="sora" style={{ fontSize:16, fontWeight:800, color:t.text, marginBottom:18 }}>Shift Distribution</div>
          {breakdown.b.length===0 ? (
            <div style={{ color:t.sub, fontSize:13 }}>Assign shifts to see distribution.</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              {breakdown.b.map(sh=>(
                <div key={sh.id} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:30, fontSize:11, fontWeight:800, color:sh.color, flexShrink:0 }}>{sh.code}</div>
                  <div style={{ flex:1, height:9, borderRadius:99, background:t.is?"rgba(255,255,255,.08)":"#F0F4FC", overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${sh.color},${sh.color}99)`, width:`${(sh.count/breakdown.max)*100}%`, transition:"width .6s cubic-bezier(.22,.68,0,1.2)" }} />
                  </div>
                  <div style={{ width:26, fontSize:11, fontWeight:700, color:t.sub, flexShrink:0 }}>{sh.count}×</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {shifts.map(sh=>(
              <div key={sh.id} className="shift-pill" style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px 6px 6px", borderRadius:99, border:`1px solid ${t.cardBdr}`, background:t.cardHov }}>
                <div style={{ width:26, height:26, borderRadius:8, background:sh.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:11, color:"#fff" }}>{sh.code}</div>
                <span style={{ fontSize:12, fontWeight:600, color:t.text }}>{sh.isOff?"Off":sh.title.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* responsive collapse for bento on small screens */}
      <style>{`@media(max-width:900px){
        .anim-fade-up > div > [style*="span 8"],
        .anim-fade-up > div > [style*="span 7"],
        .anim-fade-up > div > [style*="span 5"],
        .anim-fade-up > div > [style*="span 4"]{grid-column:span 12!important}
      }`}</style>
    </div>
  );
}
/* ────────── ROSTER (with pattern detection + auto-fill) ────────── */
function RosterView({ t, roster, shifts, startDate, endDate, setStartDate, setEndDate, generateRoster, updateEntry, applyDetectedPattern, rangeError }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dismissed, setDismissed] = useState(false);

  const cycle = useMemo(()=>detectPattern(roster),[roster]);
  const emptyCount = useMemo(()=>{
    const firstIdx=roster.findIndex(r=>r.shift);
    return firstIdx<0?0:roster.slice(firstIdx).filter(r=>!r.shift).length;
  },[roster]);
  const showBanner = cycle && emptyCount>0 && !dismissed;

  const filtered = useMemo(()=>roster.filter(r=>{
    if(filter==="work" && (r.shift==="F"||!r.shift)) return false;
    if(filter==="off"  && r.shift!=="F") return false;
    if(filter==="night"&& r.shift!=="N") return false;
    if(search && !r.date.includes(search) && !dayFull(r.date).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }),[roster,filter,search]);

  const { totalH, workCount } = useMemo(()=>{
    const w=roster.filter(r=>r.shift&&r.shift!=="F");
    return { totalH:w.reduce((a,r)=>a+calcHrs(r.startTime,r.endTime),0), workCount:w.length };
  },[roster]);

  const FILTERS=[
    { id:"all",   label:"All Days",    count:roster.length },
    { id:"work",  label:"Work Shifts", count:roster.filter(r=>r.shift&&r.shift!=="F").length },
    { id:"night", label:"Night Only",  count:roster.filter(r=>r.shift==="N").length },
    { id:"off",   label:"Off Days",    count:roster.filter(r=>r.shift==="F"||!r.shift).length },
  ];

  return (
    <div className="anim-fade-up" style={{ display:"flex", flexDirection:"column", gap:22 }}>
      <div>
        <div className="sora" style={{ fontSize:28, fontWeight:900, color:t.text, letterSpacing:"-0.6px" }}>Master Roster</div>
        <div style={{ fontSize:13, color:t.sub, marginTop:5 }}>{workCount} shifts · {totalH.toFixed(1)} hours planned</div>
      </div>

      {/* Generate */}
      <div style={{ background:t.card, border:`1px solid ${t.cardBdr}`, borderRadius:20, padding:"22px 26px", boxShadow:"0 2px 14px rgba(0,0,0,.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#2563EB" }} />
          <div style={{ fontWeight:700, color:t.text, fontSize:14 }}>Generate Schedule</div>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:14, alignItems:"flex-end" }}>
          <div style={{ flex:"1 1 160px" }}>
            <label style={{ fontSize:10, fontWeight:700, color:t.sub, marginBottom:6, textTransform:"uppercase", letterSpacing:.8, display:"block" }}>Start Date
              <Input t={t} type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{ marginTop:6 }} />
            </label>
          </div>
          <div style={{ flex:"1 1 160px" }}>
            <label style={{ fontSize:10, fontWeight:700, color:t.sub, marginBottom:6, textTransform:"uppercase", letterSpacing:.8, display:"block" }}>End Date
              <Input t={t} type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{ marginTop:6 }} />
            </label>
          </div>
          <Btn onClick={generateRoster} disabled={!startDate||!endDate} style={{ height:42, padding:"0 26px", boxShadow:"0 4px 14px rgba(37,99,235,.3)" }}>⚡ Generate</Btn>
        </div>
        {rangeError && <div style={{ marginTop:12, fontSize:12, color:"#EF4444", fontWeight:600 }}>⚠ {rangeError}</div>}
      </div>

      {/* PATTERN BANNER */}
      {showBanner && (
        <div className="anim-scale" style={{ borderRadius:18, padding:"18px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14, background:"linear-gradient(135deg,rgba(37,99,235,.12),rgba(124,58,237,.12))", border:"1.5px solid rgba(37,99,235,.3)", animation:"scaleIn .25s forwards, glow 2.5s infinite" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, minWidth:0 }}>
            <div style={{ fontSize:26 }} aria-hidden>🪄</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontWeight:800, color:t.text, fontSize:14 }} className="sora">Pattern detected — {cycle.length}-day cycle</div>
              <div style={{ fontSize:12, color:t.sub, marginTop:4, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                Repeating
                {cycle.map((c,i)=>{
                  const sh=shifts.find(s=>s.code===c);
                  return <span key={i} style={{ padding:"2px 8px", borderRadius:7, fontSize:11, fontWeight:800, background:sh?sh.color:"#94A3B8", color:"#fff" }}>{c}</span>;
                })}
                · fills <strong style={{ color:t.text }}>{emptyCount}</strong> empty day{emptyCount!==1?"s":""}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            <Btn onClick={()=>{ applyDetectedPattern(cycle); }} style={{ boxShadow:"0 4px 14px rgba(37,99,235,.3)" }}>✨ Auto-fill</Btn>
            <Btn variant="ghost" onClick={()=>setDismissed(true)} style={{ border:`1.5px solid ${t.cardBdr}`, color:t.sub }}>Dismiss</Btn>
          </div>
        </div>
      )}

      {roster.length===0 ? (
        <div style={{ background:t.card, border:`2px dashed ${t.cardBdr}`, borderRadius:20, padding:"80px 24px", textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>📅</div>
          <div style={{ fontWeight:700, color:t.text, fontSize:18 }}>No roster generated yet</div>
          <div style={{ color:t.sub, fontSize:13, marginTop:6 }}>Select a date range above and click Generate. Then fill the first few days — the planner detects your pattern and offers to fill the rest.</div>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:6, flex:1, flexWrap:"wrap" }}>
              {FILTERS.map(f=>(
                <button key={f.id} onClick={()=>setFilter(f.id)} style={{ padding:"7px 16px", borderRadius:20, border:"none", cursor:"pointer", background:filter===f.id?"#2563EB":(t.is?"#19243A":"#EEF2FF"), color:filter===f.id?"#fff":t.sub, fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}>
                  {f.label} <span style={{ opacity:.7, marginLeft:4 }}>({f.count})</span>
                </button>
              ))}
            </div>
            <TinyInput t={t} type="text" aria-label="Search by date or day" placeholder="🔍  Search date or day…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:200 }} />
          </div>

          <div style={{ background:t.card, border:`1px solid ${t.cardBdr}`, borderRadius:20, overflow:"hidden", boxShadow:"0 2px 18px rgba(0,0,0,.05)" }}>
            <div className="roster-table-wrap" style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:t.tHead }}>
                    {[
                      { label:"Date & Day", w:140 }, { label:"Shift", w:110 }, { label:"Start → End", w:170 },
                      { label:"Event Title", w:170 }, { label:"Location", w:140, cls:"hide-mob" },
                      { label:"Notes", w:150, cls:"hide-mob" }, { label:"Hours", w:65 },
                    ].map(col=>(
                      <th key={col.label} className={col.cls||""} style={{ padding:"12px 16px", textAlign:"left", fontSize:10, fontWeight:700, color:t.sub, textTransform:"uppercase", letterSpacing:.8, borderBottom:`1px solid ${t.tBdr}`, whiteSpace:"nowrap", width:col.w }}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r,idx)=>{
                    const origIdx=roster.indexOf(r);
                    const sh=shifts.find(s=>s.code===r.shift);
                    const ov=isON(r.startTime,r.endTime);
                    const hrs=calcHrs(r.startTime,r.endTime);
                    const isOff=r.shift==="F";
                    const isWeekend=[0,6].includes(new Date(r.date+"T00:00:00").getDay());
                    return (
                      <tr key={idx} className="roster-row row-hover" style={{ borderBottom:`1px solid ${t.tBdr}`, background:isOff?(t.is?"rgba(255,255,255,.015)":"rgba(5,150,105,.02)"):isWeekend?(t.is?"rgba(124,58,237,.03)":"rgba(124,58,237,.02)"):"transparent" }}>
                        <td style={{ padding:"10px 16px", whiteSpace:"nowrap" }}>
                          <div className="mono" style={{ fontWeight:600, fontSize:12, color:t.text }}>{r.date}</div>
                          <div style={{ fontSize:11, marginTop:2, fontWeight:600, color:isWeekend?"#7C3AED":t.sub }}>{dayFull(r.date)}</div>
                        </td>
                        <td style={{ padding:"10px 16px", whiteSpace:"nowrap" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            {sh && <div style={{ width:3, height:32, borderRadius:2, background:sh.color, flexShrink:0 }} />}
                            <div>
                              <select aria-label={`Shift for ${r.date}`} value={r.shift} onChange={e=>updateEntry(origIdx,"shift",e.target.value)} style={{ padding:"5px 8px", borderRadius:8, border:`1px solid ${t.inputBdr}`, background:t.inputBg, color:t.inputTxt, fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", outline:"none", width:72 }}>
                                <option value="">—</option>
                                {shifts.map(s=><option key={s.id} value={s.code}>{s.code}</option>)}
                              </select>
                              {sh && <div style={{ fontSize:10, color:sh.color, marginTop:2, fontWeight:700, paddingLeft:2 }}>{sh.title.split(" ")[0]}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:"10px 16px", whiteSpace:"nowrap" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <TinyInput t={t} type="time" aria-label="Start time" value={r.startTime} onChange={e=>updateEntry(origIdx,"startTime",e.target.value)} disabled={isOff} style={{ width:96, opacity:isOff?.4:1, fontWeight:600 }} />
                            <span style={{ color:t.sub, fontSize:10 }}>→</span>
                            <TinyInput t={t} type="time" aria-label="End time" value={r.endTime} onChange={e=>updateEntry(origIdx,"endTime",e.target.value)} disabled={isOff} style={{ width:96, opacity:isOff?.4:1, fontWeight:600 }} />
                            {ov && <span title="Overnight shift" style={{ fontSize:13 }}>🌙</span>}
                          </div>
                        </td>
                        <td style={{ padding:"10px 16px", whiteSpace:"nowrap" }}>
                          <TinyInput t={t} type="text" aria-label="Event title" value={r.eventTitle} onChange={e=>updateEntry(origIdx,"eventTitle",e.target.value)} placeholder="Event title" style={{ width:160 }} />
                        </td>
                        <td className="hide-mob" style={{ padding:"10px 16px", whiteSpace:"nowrap" }}>
                          <TinyInput t={t} type="text" aria-label="Location" value={r.location} onChange={e=>updateEntry(origIdx,"location",e.target.value)} placeholder="Location" style={{ width:120 }} />
                        </td>
                        <td className="hide-mob" style={{ padding:"10px 16px", whiteSpace:"nowrap" }}>
                          <TinyInput t={t} type="text" aria-label="Notes" value={r.notes} onChange={e=>updateEntry(origIdx,"notes",e.target.value)} placeholder="Notes" style={{ width:130 }} />
                        </td>
                        <td style={{ padding:"10px 16px", whiteSpace:"nowrap" }}>
                          {!isOff && hrs>0 ? (
                            <div style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, background:`${sh?.color||"#2563EB"}18`, color:sh?.color||"#2563EB", fontSize:11, fontWeight:700 }}>{hrs.toFixed(1)}h</div>
                          ) : isOff ? (
                            <div style={{ padding:"3px 10px", borderRadius:20, background:"rgba(5,150,105,.12)", color:"#059669", fontSize:11, fontWeight:700, display:"inline-block" }}>Off</div>
                          ) : <div style={{ color:t.sub, fontSize:11 }}>—</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding:"12px 20px", borderTop:`1px solid ${t.tBdr}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:t.tHead }}>
              <div style={{ fontSize:12, color:t.sub }}>Showing {filtered.length} of {roster.length} entries</div>
              <div style={{ fontSize:12, color:t.sub, fontWeight:600 }}>Total: <span style={{ color:t.text, fontWeight:700 }}>{totalH.toFixed(1)} hrs</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────── SHIFTS ────────── */
function ShiftsView({ t, shifts, setShifts }) {
  const BLANK={ code:"", title:"", start:"", end:"", color:"#2563EB", isOff:false };
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState(null);
  const [form,setForm]=useState(BLANK);
  const openAdd=()=>{ setForm(BLANK); setEditId(null); setShowForm(true); };
  const openEdit=sh=>{ setForm({...sh}); setEditId(sh.id); setShowForm(true); };
  const cancel=()=>{ setShowForm(false); setEditId(null); };
  const save=()=>{ if(!form.code.trim()||!form.title.trim()) return; if(editId) setShifts(p=>p.map(s=>s.id===editId?{...form,id:editId}:s)); else setShifts(p=>[...p,{...form,id:"s"+Date.now()}]); cancel(); };
  const del=id=>{ if(!window.confirm("Delete this shift?")) return; setShifts(p=>p.filter(s=>s.id!==id)); };

  return (
    <div className="anim-fade-up" style={{ display:"flex", flexDirection:"column", gap:22, maxWidth:820 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div className="sora" style={{ fontSize:28, fontWeight:900, color:t.text, letterSpacing:"-0.6px" }}>Shift Config</div>
          <div style={{ fontSize:13, color:t.sub, marginTop:5 }}>Define your operational shift templates</div>
        </div>
        <Btn onClick={openAdd} style={{ boxShadow:"0 4px 14px rgba(37,99,235,.3)" }}>+ Add Shift</Btn>
      </div>
      {showForm && (
        <div className="anim-scale" style={{ background:t.card, border:"1.5px solid rgba(37,99,235,.25)", borderRadius:22, padding:"26px 28px", boxShadow:"0 12px 40px rgba(37,99,235,.12)" }}>
          <div style={{ fontWeight:700, color:t.text, fontSize:16, marginBottom:20 }}>{editId?"✏️ Edit Shift":"✨ New Shift Profile"}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:18 }}>
            <label style={{ display:"block" }}><span style={lbl(t)}>Code</span><Input t={t} value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} placeholder="e.g. M1" style={{ marginTop:6 }} /></label>
            <label style={{ display:"block" }}><span style={lbl(t)}>Title</span><Input t={t} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Morning Shift" style={{ marginTop:6 }} /></label>
            <label style={{ display:"block" }}><span style={lbl(t)}>Color</span><input type="color" aria-label="Shift color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} style={{ width:"100%", height:42, marginTop:6, borderRadius:10, border:`1.5px solid ${t.inputBdr}`, cursor:"pointer", background:"none" }} /></label>
            <label style={{ display:"block" }}><span style={lbl(t)}>Start</span><Input t={t} type="time" value={form.start} onChange={e=>setForm(p=>({...p,start:e.target.value}))} disabled={form.isOff} style={{ opacity:form.isOff?.4:1, marginTop:6 }} /></label>
            <label style={{ display:"block" }}><span style={lbl(t)}>End</span><Input t={t} type="time" value={form.end} onChange={e=>setForm(p=>({...p,end:e.target.value}))} disabled={form.isOff} style={{ opacity:form.isOff?.4:1, marginTop:6 }} /></label>
            <div style={{ display:"flex", alignItems:"flex-end", paddingBottom:2 }}>
              <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"10px 14px", borderRadius:10, width:"100%", background:t.is?"rgba(255,255,255,.04)":"#F1F5F9", border:`1px solid ${t.cardBdr}` }}>
                <input type="checkbox" checked={form.isOff} onChange={e=>setForm(p=>({...p,isOff:e.target.checked,start:"",end:""}))} style={{ width:16, height:16, accentColor:"#2563EB", cursor:"pointer" }} />
                <span style={{ fontSize:13, fontWeight:600, color:t.text }}>Off / Rest Day</span>
              </label>
            </div>
          </div>
          {form.start&&form.end&&isON(form.start,form.end)&&(
            <div style={{ marginTop:16, padding:"10px 16px", borderRadius:10, background:"rgba(217,119,6,.08)", border:"1px solid #D97706", color:"#D97706", fontSize:12, fontWeight:600 }}>🌙 Overnight shift detected — end date auto-adjusts to next day on export.</div>
          )}
          <div style={{ display:"flex", gap:10, marginTop:20 }}>
            <Btn onClick={save} style={{ boxShadow:"0 4px 14px rgba(37,99,235,.3)" }}>{editId?"Update":"Save Profile"}</Btn>
            <Btn variant="ghost" onClick={cancel} style={{ border:`1.5px solid ${t.cardBdr}`, color:t.sub }}>Cancel</Btn>
          </div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {shifts.map(sh=>(
          <div key={sh.id} className="card-lift" style={{ background:t.card, border:`1px solid ${t.cardBdr}`, borderRadius:18, padding:"16px 22px", display:"flex", alignItems:"center", gap:18, boxShadow:"0 2px 10px rgba(0,0,0,.04)" }}>
            <div style={{ width:50, height:50, borderRadius:14, background:sh.color, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:16, color:"#fff", boxShadow:`0 6px 16px ${sh.color}45`, flexShrink:0 }}>{sh.code}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:t.text }}>{sh.title}</div>
              <div style={{ fontSize:12, color:t.sub, marginTop:3 }}>{sh.isOff?"Rest / Off Day":<>🕒 {sh.start} → {sh.end}{isON(sh.start,sh.end)&&<span style={{ color:"#D97706", fontWeight:700 }}> · 🌙 Overnight</span>}</>}</div>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button onClick={()=>openEdit(sh)} style={{ padding:"7px 14px", borderRadius:9, border:"none", cursor:"pointer", background:t.is?"rgba(37,99,235,.15)":"#EFF6FF", color:"#2563EB", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>Edit</button>
              <button onClick={()=>del(sh.id)} style={{ padding:"7px 14px", borderRadius:9, border:"none", cursor:"pointer", background:t.is?"rgba(239,68,68,.1)":"#FEE2E2", color:"#EF4444", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
const lbl = t => ({ fontSize:10, fontWeight:700, color:t.sub, textTransform:"uppercase", letterSpacing:.8, display:"block" });

/* ────────── EXPORT ────────── */
function ExportView({ t, roster, shifts }) {
  const [done,setDone]=useState(false);
  const [animating,setAnimating]=useState(false);
  const [activeApp,setActiveApp]=useState(0);
  const workRows=roster.filter(r=>r.shift&&r.shift!=="F"&&r.startTime);
  const nightRows=roster.filter(r=>r.shift==="N");
  const offRows=roster.filter(r=>r.shift==="F");
  const totalH=workRows.reduce((a,r)=>a+calcHrs(r.startTime,r.endTime),0);
  const dates=[...new Set(workRows.map(r=>r.date))];
  const canExport=workRows.length>0;
  const handleExport=()=>{ if(!canExport) return; setAnimating(true); setTimeout(()=>{ downloadICS(roster,shifts); setDone(true); setAnimating(false); setTimeout(()=>setDone(false),4000); },600); };
  const breakdown=shifts.filter(sh=>!sh.isOff).map(sh=>({ ...sh, count:roster.filter(r=>r.shift===sh.code&&r.startTime).length })).filter(s=>s.count>0);
  const maxCount=Math.max(...breakdown.map(s=>s.count),1);
  const APPS=[
    { name:"Google Calendar", icon:"🗓", color:"#4285F4", steps:["Open Google Calendar on desktop","Settings (⚙) → Import & export","Click Import → select the .ics file","Choose calendar → Import"] },
    { name:"Apple Calendar",  icon:"🍎", color:"#FF3B30", steps:["Double-click the downloaded .ics file","Or Calendar → File → Import","Select .ics file and click Import","Shifts appear instantly"] },
    { name:"Outlook",         icon:"📧", color:"#0078D4", steps:["Open Outlook → File menu","Open & Export → Import/Export","Import an iCalendar (.ics) file","Navigate to file → OK"] },
  ];
  return (
    <div className="anim-fade-up" style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:820 }}>
      <div>
        <div className="sora" style={{ fontSize:28, fontWeight:900, color:t.text, letterSpacing:"-0.6px" }}>Export Calendar</div>
        <div style={{ fontSize:13, color:t.sub, marginTop:5 }}>Generate a universal .ics file and import into any calendar app</div>
      </div>
      <div style={{ background:t.card, border:`1px solid ${t.cardBdr}`, borderRadius:22, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,.06)" }}>
        <div style={{ background:canExport?"linear-gradient(135deg,#1D4ED8 0%,#7C3AED 100%)":(t.is?"#19243A":"#F1F5F9"), padding:"28px 32px", position:"relative", overflow:"hidden" }}>
          {canExport && <div style={{ position:"absolute", top:"-40%", right:"-5%", width:280, height:280, background:"rgba(255,255,255,.07)", borderRadius:"50%", filter:"blur(30px)" }} />}
          <div style={{ position:"relative", zIndex:1, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
            <div>
              <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:1.5, color:canExport?"rgba(255,255,255,.7)":t.sub, fontWeight:700, marginBottom:8 }}>Export Summary</div>
              <div className="sora" style={{ fontSize:38, fontWeight:900, color:canExport?"#fff":t.text, lineHeight:1, letterSpacing:"-0.8px" }}>{workRows.length}<span style={{ fontSize:18, fontWeight:600, marginLeft:8, opacity:.75 }}>shifts</span></div>
              <div style={{ fontSize:13, color:canExport?"rgba(255,255,255,.75)":t.sub, marginTop:6 }}>{totalH.toFixed(1)} hours · {nightRows.length} overnight · {dates.length} unique dates</div>
            </div>
            <button onClick={handleExport} disabled={!canExport||animating} aria-label="Download ICS file" className="btn-hover" style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 28px", borderRadius:14, border:canExport?"1px solid rgba(255,255,255,.3)":"none", cursor:canExport&&!animating?"pointer":"not-allowed", background:done?"#059669":canExport?"rgba(255,255,255,.2)":"#CBD5E1", color:"#fff", fontSize:15, fontWeight:700, fontFamily:"'DM Sans',sans-serif", transition:"all .2s", opacity:!canExport?.45:1 }}>
              {animating?<><span style={{ animation:"pulse 1s infinite" }}>⏳</span> Generating…</>:done?<><span>✅</span> Downloaded!</>:<>📥 Download .ics</>}
            </button>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", borderBottom:`1px solid ${t.tBdr}` }}>
          {[
            { label:"Work Shifts", val:workRows.length, icon:"📋", clr:"#2563EB" },
            { label:"Night Shifts", val:nightRows.length, icon:"🌙", clr:"#7C3AED" },
            { label:"Off Days", val:offRows.length, icon:"🏖", clr:"#059669" },
            { label:"Total Hours", val:totalH.toFixed(1)+"h", icon:"⏱", clr:"#D97706" },
          ].map((s,i,arr)=>(
            <div key={i} style={{ padding:"20px 22px", textAlign:"center", borderRight:i<arr.length-1?`1px solid ${t.tBdr}`:"none" }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div className="sora" style={{ fontSize:22, fontWeight:900, color:s.clr, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:11, color:t.sub, marginTop:4, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {breakdown.length>0 && (
          <div style={{ padding:"22px 28px", borderBottom:`1px solid ${t.tBdr}` }}>
            <div style={{ fontSize:12, fontWeight:700, color:t.sub, textTransform:"uppercase", letterSpacing:.8, marginBottom:16 }}>Shift Breakdown</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {breakdown.map(sh=>(
                <div key={sh.id} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:36, textAlign:"right", fontSize:11, fontWeight:800, color:sh.color, flexShrink:0 }}>{sh.code}</div>
                  <div style={{ flex:1, height:10, borderRadius:99, background:t.is?"rgba(255,255,255,.08)":"#F0F4FC", overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${sh.color},${sh.color}99)`, width:`${(sh.count/maxCount)*100}%`, transition:"width .6s cubic-bezier(.22,.68,0,1.2)" }} />
                  </div>
                  <div style={{ width:32, fontSize:11, fontWeight:700, color:t.sub, flexShrink:0 }}>{sh.count}×</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!canExport && <div style={{ padding:"24px 28px", textAlign:"center" }}><div style={{ fontSize:11, color:t.sub, fontWeight:600 }}>💡 Generate your roster and assign shift types to enable export</div></div>}
      </div>
      <div style={{ background:t.card, border:`1px solid ${t.cardBdr}`, borderRadius:22, padding:"24px 28px", boxShadow:"0 2px 14px rgba(0,0,0,.04)" }}>
        <div style={{ fontWeight:700, color:t.text, fontSize:16, marginBottom:20 }}>📲 Import Guide</div>
        <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
          {APPS.map((app,i)=>(
            <button key={i} onClick={()=>setActiveApp(i)} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:20, border:`1.5px solid ${activeApp===i?app.color:t.cardBdr}`, background:activeApp===i?`${app.color}15`:"transparent", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700, color:activeApp===i?app.color:t.sub, transition:"all .15s" }}>
              <span style={{ fontSize:16 }}>{app.icon}</span>{app.name}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {APPS[activeApp].steps.map((step,i)=>(
            <div key={i} className="anim-slide-r" style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", borderRadius:12, background:t.cardHov, border:`1px solid ${t.cardBdr}` }}>
              <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, background:`${APPS[activeApp].color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:APPS[activeApp].color }}>{i+1}</div>
              <div style={{ fontSize:13, color:t.text, fontWeight:500 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────── SETTINGS ────────── */
function SettingsView({ t, dark, setDark, setRoster, setShifts }) {
  const clearRoster=()=>{ if(!window.confirm("Clear all roster data?")) return; setRoster([]); };
  const resetShifts=()=>{ if(!window.confirm("Reset shifts to defaults?")) return; setShifts(DEFAULT_SHIFTS); };
  const Row=({ label, sub, right })=>(
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 0", borderBottom:`1px solid ${t.tBdr}` }}>
      <div><div style={{ fontWeight:600, fontSize:14, color:t.text }}>{label}</div>{sub && <div style={{ fontSize:12, color:t.sub, marginTop:3 }}>{sub}</div>}</div>{right}
    </div>
  );
  return (
    <div className="anim-fade-up" style={{ display:"flex", flexDirection:"column", gap:22, maxWidth:560 }}>
      <div>
        <div className="sora" style={{ fontSize:28, fontWeight:900, color:t.text, letterSpacing:"-0.6px" }}>Settings</div>
        <div style={{ fontSize:13, color:t.sub, marginTop:5 }}>Preferences & data management</div>
      </div>
      <div style={{ background:t.card, border:`1px solid ${t.cardBdr}`, borderRadius:20, padding:"6px 24px", boxShadow:"0 2px 14px rgba(0,0,0,.04)" }}>
        <Row label="Dark Mode" sub="Switch to high-contrast dark theme" right={
          <button role="switch" aria-checked={dark} aria-label="Toggle dark mode" onClick={()=>setDark(!dark)} style={{ width:48, height:26, borderRadius:13, border:"none", cursor:"pointer", background:dark?"#2563EB":"#CBD5E1", position:"relative", transition:"background .2s" }}>
            <div style={{ position:"absolute", top:3, width:20, height:20, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,.2)", transform:dark?"translateX(25px)":"translateX(3px)", transition:"transform .2s" }} />
          </button>
        } />
        <Row label="Clear Roster" sub="Permanently delete all roster entries" right={<button onClick={clearRoster} style={{ padding:"7px 16px", borderRadius:9, border:"1.5px solid #FCA5A5", background:"transparent", color:"#EF4444", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Clear</button>} />
        <Row label="Reset Shifts" sub="Restore all shift presets to defaults" right={<button onClick={resetShifts} style={{ padding:"7px 16px", borderRadius:9, border:`1.5px solid ${t.cardBdr}`, background:"transparent", color:t.sub, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Reset</button>} />
      </div>
      <div style={{ background:t.card, border:`1px solid ${t.cardBdr}`, borderRadius:20, padding:"22px 24px", boxShadow:"0 2px 14px rgba(0,0,0,.04)" }}>
        <div style={{ fontWeight:700, color:t.text, fontSize:14, marginBottom:6 }}>About</div>
        <div style={{ fontSize:13, color:t.sub, lineHeight:1.8 }}>Smart Shift Roster Planner v3.0<br/>All data stored locally in your browser. Nothing leaves your device.</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:14 }}>
          {["ICS Export","Pattern Auto-fill","Night Shift Logic","Local Storage","Dark Mode","Mobile Friendly"].map(tag=>(
            <span key={tag} style={{ padding:"4px 12px", borderRadius:20, background:t.tag, color:t.sub, fontSize:11, fontWeight:700 }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────── APP ROOT ────────── */
const loadStore = (key, fallback) => {
  try {
    const raw=localStorage.getItem(key);
    if(!raw) return fallback;
    const parsed=JSON.parse(raw);
    if(parsed && parsed.__v===STORE_VERSION && "data" in parsed) return parsed.data;
    return fallback; // version mismatch / legacy shape -> safe default
  } catch { return fallback; }
};
const saveStore = (key, data) => { try { localStorage.setItem(key, JSON.stringify({ __v:STORE_VERSION, data })); } catch {} };

export default function App() {
  const [view,setView]=useState("dashboard");
  const [dark,setDark]=useState(()=>loadStore("ssrp_dark", false));
  const [mobOpen,setMobOpen]=useState(false);
  const [startDate,setStartDate]=useState("");
  const [endDate,setEndDate]=useState("");
  const [rangeError,setRangeError]=useState("");
  const [shifts,setShifts]=useState(()=>loadStore("ssrp_shifts", DEFAULT_SHIFTS));
  const [roster,setRoster]=useState(()=>loadStore("ssrp_roster", []));

  useEffect(()=>{ saveStore("ssrp_shifts", shifts); },[shifts]);
  useEffect(()=>{ saveStore("ssrp_roster", roster); },[roster]);
  useEffect(()=>{ saveStore("ssrp_dark", dark); },[dark]);

  const t=useMemo(()=>T(dark),[dark]);

  const generateRoster=useCallback(()=>{
    if(!startDate||!endDate) return;
    if(startDate>endDate){ setRangeError("Start date must be on or before the end date."); return; }
    setRangeError("");
    const dates=genDates(startDate,endDate);
    const map={}; roster.forEach(r=>{ map[r.date]=r; });
    setRoster(dates.map(date=>map[date]||{ date, day:dayFull(date), shift:"", startTime:"", endTime:"", eventTitle:"", location:"", notes:"" }));
  },[startDate,endDate,roster]);

  const updateEntry=useCallback((idx,field,value)=>{
    setRoster(prev=>{
      const next=[...prev]; const row={ ...next[idx], [field]:value };
      if(field==="shift"){ const sh=shifts.find(s=>s.code===value); if(sh){ row.startTime=sh.isOff?"":sh.start; row.endTime=sh.isOff?"":sh.end; row.eventTitle=sh.title; } }
      next[idx]=row; return next;
    });
  },[shifts]);

  // Apply detected cycle to all empty days (non-destructive: manual entries untouched)
  const applyDetectedPattern=useCallback(cycle=>{
    if(!cycle||!cycle.length) return;
    setRoster(prev=>{
      const firstIdx=prev.findIndex(r=>r.shift); if(firstIdx<0) return prev;
      return prev.map((r,i)=>{
        if(r.shift||i<firstIdx) return r;
        const code=cycle[(i-firstIdx)%cycle.length];
        const sh=shifts.find(s=>s.code===code);
        if(!sh) return r;
        return { ...r, shift:code, startTime:sh.isOff?"":sh.start, endTime:sh.isOff?"":sh.end, eventTitle:sh.title };
      });
    });
  },[shifts]);

  const VIEWS={
    dashboard:<DashboardView t={t} roster={roster} shifts={shifts} setView={setView} />,
    roster:<RosterView t={t} roster={roster} shifts={shifts} startDate={startDate} endDate={endDate} setStartDate={setStartDate} setEndDate={setEndDate} generateRoster={generateRoster} updateEntry={updateEntry} applyDetectedPattern={applyDetectedPattern} rangeError={rangeError} />,
    shifts:<ShiftsView t={t} shifts={shifts} setShifts={setShifts} />,
    export:<ExportView t={t} roster={roster} shifts={shifts} />,
    settings:<SettingsView t={t} dark={dark} setDark={setDark} setRoster={setRoster} setShifts={setShifts} />,
  };

  return (
    <div data-dark={dark||undefined} style={{ minHeight:"100vh", background:t.bg, fontFamily:"'DM Sans',sans-serif", display:"flex", transition:"background .25s" }}>
      <GlobalStyle />
      <Sidebar view={view} setView={setView} dark={dark} setDark={setDark} t={t} open={mobOpen} setOpen={setMobOpen} />
      <div className="main-content" style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <style>{`@media(min-width:768px){.main-content{margin-left:248px}}`}</style>
        <Header t={t} roster={roster} shifts={shifts} mobOpen={mobOpen} setMobOpen={setMobOpen} />
        <main style={{ flex:1, padding:"28px 32px", overflowY:"auto" }}>{VIEWS[view]}</main>
      </div>
    </div>
  );
}
