// GUTO Coach Panel — Design tokens, atoms, sidebar, header
// All shared via window.*

const { useState: useSh, useContext: useCtxSh } = React;

/* ── TOKENS ──────────────────────────────────────────────────────────────── */
const T = {
  ink:       "#060912",
  bg:        "#080e1c",
  panel:     "rgba(15,22,42,0.86)",
  panelDp:   "rgba(8,12,26,0.92)",
  panelHi:   "rgba(22,32,58,0.90)",
  border:    "rgba(82,231,255,0.10)",
  borderHi:  "rgba(82,231,255,0.26)",
  fg:        "#e8f4ff",
  fg2:       "rgba(232,244,255,0.60)",
  fg3:       "rgba(232,244,255,0.38)",
  fg4:       "rgba(232,244,255,0.18)",
  cyan:      "#52e7ff",
  cyanSoft:  "rgba(82,231,255,0.14)",
  cyanLine:  "rgba(82,231,255,0.24)",
  ok:        "#4ade80",   okS: "rgba(74,222,128,0.13)",
  warn:      "#fbbf24",   warnS: "rgba(251,191,36,0.13)",
  bad:       "#f87171",   badS: "rgba(248,113,113,0.13)",
  mono: '"JetBrains Mono","SF Mono",Menlo,Monaco,Consolas,monospace',
};

/* ── ATOMS ───────────────────────────────────────────────────────────────── */
const Plate = ({ children, style={}, dp, hi, glow }) => (
  <div style={{
    background: dp ? T.panelDp : hi ? T.panelHi : T.panel,
    border: `1px solid ${glow ? T.cyanLine : T.border}`,
    borderRadius: 14,
    boxShadow: glow
      ? `0 0 28px rgba(82,231,255,0.15), inset 0 0 0 1px ${T.cyanLine}`
      : "0 4px 20px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
    ...style,
  }}>{children}</div>
);

const Kicker = ({ children, cyan, style={} }) => (
  <span style={{
    fontFamily: T.mono, fontSize: 9, fontWeight: 900,
    letterSpacing: "0.28em", textTransform: "uppercase",
    color: cyan ? T.cyan : T.fg3, ...style,
  }}>{children}</span>
);

const Label = ({ children, style={} }) => (
  <span style={{
    display: "block", fontFamily: T.mono, fontSize: 10, fontWeight: 900,
    letterSpacing: "0.22em", textTransform: "uppercase",
    color: T.fg3, marginBottom: 6, ...style,
  }}>{children}</span>
);

const Pill = ({ tone="neutral", children, style={} }) => {
  const map = {
    neutral: { bg:"rgba(232,244,255,0.06)", fg:T.fg2, bd:"rgba(232,244,255,0.10)" },
    cyan:    { bg:T.cyanSoft, fg:T.cyan, bd:T.cyanLine },
    ok:      { bg:T.okS,   fg:T.ok,   bd:"rgba(74,222,128,0.28)"  },
    warn:    { bg:T.warnS, fg:T.warn, bd:"rgba(251,191,36,0.28)"  },
    bad:     { bg:T.badS,  fg:T.bad,  bd:"rgba(248,113,113,0.28)" },
    mute:    { bg:"rgba(232,244,255,0.04)", fg:T.fg3, bd:"rgba(232,244,255,0.08)" },
  };
  const p = map[tone] ?? map.neutral;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      height:20, padding:"0 9px", borderRadius:999,
      background:p.bg, color:p.fg, border:`1px solid ${p.bd}`,
      fontFamily:T.mono, fontSize:9, fontWeight:900,
      letterSpacing:"0.18em", textTransform:"uppercase",
      ...style,
    }}>{children}</span>
  );
};

const Btn = ({ children, onClick, cyan, ghost, danger, sm, style={} }) => (
  <button onClick={onClick} style={{
    height: sm ? 34 : 40, padding: `0 ${sm ? 12 : 16}px`,
    borderRadius: 999, cursor:"pointer", border:"none",
    background: cyan
      ? `linear-gradient(135deg,#7df0ff,#1ec5e0)`
      : ghost
        ? "transparent"
        : danger
          ? T.badS
          : "rgba(232,244,255,0.07)",
    color: cyan ? "#04131e" : danger ? T.bad : T.fg,
    border: ghost ? `1px solid ${T.cyanLine}` : danger ? `1px solid rgba(248,113,113,0.30)` : `1px solid ${T.border}`,
    fontFamily: T.mono, fontSize: 10, fontWeight: 900,
    letterSpacing:"0.20em", textTransform:"uppercase",
    boxShadow: cyan ? "0 0 18px rgba(82,231,255,0.28)" : "none",
    transition: "all 160ms ease",
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
    flexShrink: 0,
    ...style,
  }}>{children}</button>
);

const SearchBox = ({ value, onChange, placeholder }) => (
  <div style={{ position:"relative", flex:1, maxWidth:340 }}>
    <svg style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:T.fg3, pointerEvents:"none" }}
         viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
    </svg>
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder ?? "Buscar…"}
      style={{
        width:"100%", height:38, paddingLeft:36, paddingRight:14,
        background:"rgba(0,0,0,0.30)",
        border:`1px solid ${T.border}`,
        borderRadius:10,
        boxShadow:"inset 0 2px 6px rgba(0,0,0,0.45)",
        fontFamily:T.mono, fontSize:12, color:T.fg,
        outline:"none",
      }}
    />
  </div>
);

const DataRow = ({ label, value }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
    borderBottom:`1px solid ${T.border}`, padding:"10px 0",
    fontFamily:T.mono, fontSize:11 }}>
    <span style={{ color:T.fg3 }}>{label}</span>
    <span style={{ color:T.fg, fontWeight:700, textAlign:"right", maxWidth:"60%" }}>{value}</span>
  </div>
);

const SectionTitle = ({ children, action }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
    marginBottom:14 }}>
    <Kicker cyan>{children}</Kicker>
    {action}
  </div>
);

/* ── ICONS ───────────────────────────────────────────────────────────────── */
const SI = ({ d, size=16, sw=1.9 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IZap      = p=><SI d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/>} {...p}/>;
const IUsers    = p=><SI d={<g><circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M22 21a7 7 0 0 0-5-6.7"/></g>} {...p}/>;
const IDumbbell = p=><SI d={<g><path d="M14.4 14.4 9.6 9.6"/><path d="M18.6 21.5a2 2 0 1 1-2.8-2.8M14 19.4l5.4-5.4M5.4 2.5a2 2 0 1 1 2.8 2.8M10 4.6 4.6 10M21.5 21.5l-1.4-1.4M3.9 3.9 2.5 2.5M6.4 12.8a2 2 0 1 1-2.8-2.8M5.3 7.4a2 2 0 1 1-2.8-2.8"/></g>} {...p}/>;
const IFork     = p=><SI d={<g><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7"/></g>} {...p}/>;
const ITrend    = p=><SI d={<g><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></g>} {...p}/>;
const IShield   = p=><SI d={<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/>} {...p}/>;
const IBuilding = p=><SI d={<g><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></g>} {...p}/>;
const ILog      = p=><SI d={<g><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h10M7 17h6"/></g>} {...p}/>;
const IChevL    = p=><SI d={<polyline points="15 18 9 12 15 6"/>} {...p}/>;
const IChevR    = p=><SI d={<polyline points="9 6 15 12 9 18"/>} {...p}/>;
const IPlus     = p=><SI d={<g><path d="M12 5v14"/><path d="M5 12h14"/></g>} {...p}/>;
const IX        = p=><SI d={<g><path d="M18 6 6 18"/><path d="m6 6 12 12"/></g>} {...p}/>;
const ICopy     = p=><SI d={<g><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></g>} {...p}/>;
const ICheck    = p=><SI d={<polyline points="20 6 9 17 4 12"/>} {...p}/>;
const ILock     = p=><SI d={<g><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></g>} {...p}/>;
const ICalib    = p=><SI d={<g><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2 2"/><path d="M16.2 7.8 19 5"/></g>} {...p}/>;
const IHist     = p=><SI d={<g><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></g>} {...p}/>;
const IMenu     = p=><SI d={<g><path d="M3 12h18M3 6h18M3 18h18"/></g>} {...p}/>;
const ITrash    = p=><SI d={<g><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></g>} {...p}/>;
const ISave     = p=><SI d={<g><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></g>} {...p}/>;
const ISliders  = p=><SI d={<g><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></g>} {...p}/>;

/* ── SIDEBAR ─────────────────────────────────────────────────────────────── */
const NAV = [
  { id:"hoje",     label:"HOJE",     Icon:IZap      },
  { id:"students", label:"ALUNOS",   Icon:IUsers    },
  { id:"treinos",  label:"TREINOS",  Icon:IDumbbell },
  { id:"dietas",   label:"DIETAS",   Icon:IFork     },
  { id:"arena",    label:"ARENA",    Icon:ITrend    },
  { id:"coaches",  label:"COACHES",  Icon:IShield   },
  { id:"teams",    label:"TIMES",    Icon:IBuilding },
  { id:"logs",     label:"LOGS",     Icon:ILog      },
  { id:"tweaks",   label:"TWEAKS",   Icon:ISliders  },
];

function Sidebar({ collapsed, onToggle }) {
  const ctx = React.useContext(window.PanelCtx);
  return (
    <aside style={{
      width: collapsed ? 64 : 220, flexShrink:0,
      height:"100vh", display:"flex", flexDirection:"column",
      background:"rgba(5,9,20,0.96)",
      borderRight:`1px solid ${T.border}`,
      transition:"width 200ms ease",
      overflow:"hidden",
    }}>
      {/* Brand strip */}
      <div style={{
        height:60, display:"flex", alignItems:"center",
        padding: collapsed ? "0 0 0 18px" : "0 16px",
        borderBottom:`1px solid ${T.border}`,
        gap:10, flexShrink:0,
      }}>
        {!collapsed && (
          <img src="logo_guto.png" alt="GUTO"
            style={{ height:24, objectFit:"contain", filter:"brightness(1.1)" }}/>
        )}
        {collapsed && (
          <div style={{ width:28, height:28, borderRadius:8,
            background:T.cyanSoft, border:`1px solid ${T.cyanLine}`,
            display:"grid", placeItems:"center", color:T.cyan }}>
            <IShield size={14}/>
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} style={{
            marginLeft:"auto", background:"none", border:"none",
            cursor:"pointer", color:T.fg3, padding:4,
            display:"flex", alignItems:"center",
          }}><IChevL size={15}/></button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:"auto", padding:"10px 0" }}>
        {NAV.map(({ id, label, Icon }) => {
          const active = ctx.activeScreen === id;
          return (
            <button key={id} onClick={() => ctx.setActiveScreen(id)}
              title={collapsed ? label : undefined}
              style={{
                width:"100%", height:44,
                display:"flex", alignItems:"center",
                gap:12, padding: collapsed ? "0 0 0 20px" : "0 16px",
                background: active ? T.cyanSoft : "transparent",
                borderRight: active ? `2px solid ${T.cyan}` : "2px solid transparent",
                border: "none", cursor:"pointer",
                color: active ? T.cyan : T.fg3,
                fontFamily:T.mono, fontSize:10, fontWeight:900,
                letterSpacing:"0.22em", textTransform:"uppercase",
                transition:"all 140ms ease",
                textAlign:"left",
              }}>
              <Icon size={16} sw={active ? 2.2 : 1.8}/>
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          borderTop:`1px solid ${T.border}`,
          padding:"14px 16px",
          flexShrink:0,
        }}>
          <div style={{ fontFamily:T.mono, fontSize:11, fontWeight:700, color:T.fg2, marginBottom:3 }}>
            Admin
          </div>
          <div style={{ fontFamily:T.mono, fontSize:9, color:T.fg3 }}>admin@guto.fit</div>
          <Pill tone="cyan" style={{ marginTop:8 }}>SUPER ADMIN</Pill>
        </div>
      )}
      {collapsed && (
        <button onClick={onToggle} style={{
          background:"none", border:"none", cursor:"pointer",
          color:T.fg3, padding:"14px 0", display:"flex",
          justifyContent:"center",
        }}><IChevR size={15}/></button>
      )}
    </aside>
  );
}

/* ── HEADER ──────────────────────────────────────────────────────────────── */
const SCREEN_TITLES = {
  hoje:"Hoje", students:"Alunos", treinos:"Fila de Treinos",
  dietas:"Fila de Dietas", arena:"Arena", coaches:"Coaches",
  teams:"Times", logs:"Logs", tweaks:"Tweaks",
};

function Header({ onMobileMenu }) {
  const ctx = React.useContext(window.PanelCtx);
  const title = SCREEN_TITLES[ctx.activeScreen] ?? ctx.activeScreen;
  return (
    <header style={{
      height:60, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 24px",
      background:"rgba(8,14,28,0.92)",
      borderBottom:`1px solid ${T.border}`,
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      position:"sticky", top:0, zIndex:20,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onMobileMenu} style={{
          display:"none", background:"none", border:"none",
          cursor:"pointer", color:T.fg3,
        }}><IMenu size={18}/></button>
        <div>
          <div style={{ fontFamily:T.mono, fontSize:15, fontWeight:900, color:T.fg, letterSpacing:"-0.01em" }}>
            {title}
          </div>
          <div style={{ fontFamily:T.mono, fontSize:9, color:T.fg3, letterSpacing:"0.18em" }}>
            ALPHA TEAM · 10 ALUNOS
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        {(ctx.tweaks?.showCta ?? true) && ctx.activeScreen === "teams" && (
          <Btn cyan sm onClick={()=>{}}><IPlus size={12}/>Criar Time</Btn>
        )}
        {(ctx.tweaks?.showCta ?? true) && ctx.activeScreen === "coaches" && (
          <Btn ghost sm onClick={()=>{}}><IPlus size={12}/>+ Coach</Btn>
        )}
        {(ctx.tweaks?.showCta ?? true) && ctx.activeScreen !== "tweaks" && (
          <Btn cyan sm onClick={()=>ctx.setShowCreate(true)}>
            <IPlus size={12}/>+ Aluno
          </Btn>
        )}
      </div>
    </header>
  );
}

Object.assign(window, {
  T, Plate, Kicker, Label, Pill, Btn, SearchBox, DataRow, SectionTitle,
  SI, IZap, IUsers, IDumbbell, IFork, ITrend, IShield, IBuilding, ILog,
  IChevL, IChevR, IPlus, IX, ICopy, ICheck, ILock, ICalib, IHist, IMenu, ITrash, ISave, ISliders,
  Sidebar, Header,
});
