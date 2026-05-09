// GUTO Coach Panel — All 8 main screens
// Depends on: panel-data.jsx (window.MOCK_*), panel-shell.jsx (window.T, atoms)

const { useState: useSc, useMemo: useMSc, useContext: useCtxSc } = React;

/* ── shared risk helpers ─────────────────────────────────────────────────── */
function RiskPill({ student }) {
  const r = calcRisk(student);
  const map = {
    ok:        { tone:"ok",      label:"EM DIA"    },
    atencao:   { tone:"warn",    label:"ATENÇÃO"   },
    critico:   { tone:"bad",     label:"CRÍTICO"   },
    "sem-sinal":{ tone:"mute",   label:"SEM SINAL" },
    pausado:   { tone:"neutral", label:"PAUSADO"   },
  };
  const { tone, label } = map[r] ?? map.pausado;
  return <Pill tone={tone}>{label}</Pill>;
}

function SubPill({ status }) {
  const map = {
    active:"ok", paused:"mute", overdue:"bad", cancelled:"neutral", trial:"warn",
  };
  return <Pill tone={map[status]??'neutral'}>{subLabel(status)}</Pill>;
}

/* ── StatCard (Hoje) ─────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub, tone="cyan", onClick }) {
  const colors = { cyan:T.cyan, ok:T.ok, warn:T.warn, bad:T.bad };
  const softs  = { cyan:T.cyanSoft, ok:T.okS, warn:T.warnS, bad:T.badS };
  const c = colors[tone], s = softs[tone];
  return (
    <button onClick={onClick} style={{
      background: s,
      border:`1px solid ${c}28`,
      borderRadius:16, padding:"20px 20px 18px",
      textAlign:"left", cursor: onClick ? "pointer" : "default",
      transition:"all 160ms ease",
      flex:1, minWidth:160,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, color:`${c}99`, marginBottom:12 }}>
        {icon}
        <span style={{ fontFamily:T.mono, fontSize:9, fontWeight:900, letterSpacing:"0.24em", textTransform:"uppercase" }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily:T.mono, fontSize:36, fontWeight:900, color:c, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:T.mono, fontSize:10, color:`${c}70`, marginTop:6 }}>{sub}</div>}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOJE
══════════════════════════════════════════════════════════════════════════ */
function HojeScreen() {
  const ctx = useCtxSc(window.PanelCtx);
  const today = new Date().toISOString().split("T")[0];

  const stats = useMSc(() => {
    const ativos = MOCK_STUDENTS.filter(s=>s.active && !s.archived);
    return {
      ativos,
      validatedToday: ativos.filter(s=>s.lastValidationAt?.startsWith(today)),
      criticos: ativos.filter(s=>calcRisk(s)==="critico"),
      atencao:  ativos.filter(s=>calcRisk(s)==="atencao"),
      semSinal: ativos.filter(s=>calcRisk(s)==="sem-sinal"),
    };
  }, [today]);

  const priority = useMSc(() =>
    [...stats.criticos, ...stats.atencao, ...stats.semSinal].slice(0, 10),
    [stats]
  );

  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:28 }}>
      {/* Stat cards */}
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        <StatCard icon={<IUsers size={15}/>} label="Ativos" value={stats.ativos.length}
          sub="com acesso liberado" tone="cyan" onClick={()=>ctx.setActiveScreen("students")}/>
        <StatCard icon={<ICheck size={15}/>} label="Treinos hoje" value={stats.validatedToday.length}
          sub="validações no dia" tone="ok"/>
        <StatCard icon={<IDumbbell size={15}/>} label="Atenção" value={stats.atencao.length}
          sub="3–6 dias sem treinar" tone="warn" onClick={()=>ctx.setActiveScreen("students")}/>
        <StatCard icon={<IZap size={15}/>} label="Críticos" value={stats.criticos.length}
          sub="7+ dias sem treinar" tone="bad" onClick={()=>ctx.setActiveScreen("students")}/>
      </div>

      {/* Priority list */}
      <div>
        <SectionTitle action={priority.length > 8 &&
          <Btn ghost sm onClick={()=>ctx.setActiveScreen("students")}>Ver todos</Btn>}>
          PRECISAM DE ATENÇÃO
        </SectionTitle>
        {priority.length === 0 ? (
          <Plate style={{ padding:"48px 24px", textAlign:"center" }}>
            <ICheck size={32} style={{ color:T.ok, margin:"0 auto 12px" }}/>
            <div style={{ fontFamily:T.mono, fontSize:12, color:T.fg2 }}>Todos os alunos estão em dia.</div>
          </Plate>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {priority.map(s=>(
              <button key={s.id} onClick={()=>ctx.openStudent(s)}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  gap:16, padding:"14px 18px",
                  background:T.panel, border:`1px solid ${T.border}`,
                  borderRadius:12, cursor:"pointer",
                  transition:"border-color 140ms ease",
                  textAlign:"left",
                }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.fg, marginBottom:3 }}>
                    {s.name}
                  </div>
                  <div style={{ fontFamily:T.mono, fontSize:10, color:T.fg3 }}>
                    {s.lastValidationAt
                      ? `último treino ${relativeTime(s.lastValidationAt)}`
                      : s.lastActiveAt ? `visto ${relativeTime(s.lastActiveAt)}` : "sem sinal"}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                  <span style={{ fontFamily:T.mono, fontSize:10, color:T.fg3 }}>{s.weeklyXp} XP</span>
                  <RiskPill student={s}/>
                  <IChevR size={14} style={{ color:T.fg4 }}/>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <SectionTitle>AÇÕES RÁPIDAS</SectionTitle>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {[["treinos","Fila de Treinos"],["dietas","Fila de Dietas"],["arena","Ranking Arena"]].map(([id,label])=>(
            <Btn key={id} ghost onClick={()=>ctx.setActiveScreen(id)}>{label}</Btn>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ALUNOS
══════════════════════════════════════════════════════════════════════════ */
function AlunosScreen() {
  const ctx = useCtxSc(window.PanelCtx);
  const [search, setSearch] = useSc("");
  const [filter, setFilter] = useSc("ativos");
  const [coachF, setCoachF] = useSc("");

  const list = useMSc(()=>{
    let s = [...MOCK_STUDENTS];
    if (filter==="ativos")    s = s.filter(x=>x.active && !x.archived);
    if (filter==="pausados")  s = s.filter(x=>!x.active && !x.archived);
    if (filter==="arquivados")s = s.filter(x=>x.archived);
    if (coachF) s = s.filter(x=>x.coachId===coachF);
    if (search) {
      const q = search.toLowerCase();
      s = s.filter(x=>x.name.toLowerCase().includes(q)||x.email.toLowerCase().includes(q));
    }
    return s;
  }, [search, filter, coachF]);

  const FILTERS = ["ativos","pausados","arquivados","todos"];

  return (
    <div style={{ padding:"24px 28px" }}>
      {/* Toolbar */}
      <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginBottom:16 }}>
        <SearchBox value={search} onChange={setSearch}/>
        <div style={{ display:"flex", gap:6 }}>
          {FILTERS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              height:34, padding:"0 14px", borderRadius:999,
              border: filter===f ? `1px solid ${T.cyan}` : `1px solid ${T.border}`,
              background: filter===f ? T.cyan : "transparent",
              color: filter===f ? "#04131e" : T.fg3,
              fontFamily:T.mono, fontSize:9, fontWeight:900, letterSpacing:"0.18em",
              textTransform:"uppercase", cursor:"pointer",
            }}>{f}</button>
          ))}
        </div>
        <select value={coachF} onChange={e=>setCoachF(e.target.value)}
          style={{ height:34, padding:"0 12px", borderRadius:8, border:`1px solid ${T.border}`,
            background:"rgba(0,0,0,0.30)", color: coachF ? T.fg : T.fg3,
            fontFamily:T.mono, fontSize:10 }}>
          <option value="">Todos os coaches</option>
          {MOCK_COACHES.map(c=><option key={c.userId} value={c.userId}>{c.name}</option>)}
        </select>
      </div>

      {/* Student rows */}
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {list.map(s=>(
          <button key={s.id} onClick={()=>ctx.openStudent(s)}
            style={{
              display:"grid",
              gridTemplateColumns:"minmax(200px,2fr) 100px 120px 90px 90px 80px 80px auto",
              alignItems:"center", gap:16,
              padding:"14px 18px",
              background:T.panel, border:`1px solid ${T.border}`,
              borderRadius:12, cursor:"pointer",
              textAlign:"left", transition:"border-color 140ms ease",
            }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.fg,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom:2 }}>
                {s.name}
              </div>
              <div style={{ fontFamily:T.mono, fontSize:10, color:T.fg3,
                whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                {s.email}
              </div>
            </div>
            <RiskPill student={s}/>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.fg2, whiteSpace:"nowrap" }}>
              {coachName(s.coachId)}
            </div>
            <div style={{ fontFamily:T.mono, fontSize:11, color:T.cyan, fontWeight:700 }}>
              {s.weeklyXp} XP
            </div>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.fg3 }}>
              {relativeTime(s.lastValidationAt)}
            </div>
            <SubPill status={s.subscriptionStatus}/>
            <div style={{ fontFamily:T.mono, fontSize:11, color:T.fg3 }}>
              {avatarLabel(s.avatarStage)}
            </div>
            <IChevR size={14} style={{ color:T.fg4 }}/>
          </button>
        ))}
        {!list.length && (
          <Plate style={{ padding:"48px 24px", textAlign:"center" }}>
            <div style={{ fontFamily:T.mono, fontSize:12, color:T.fg3 }}>Nenhum aluno encontrado.</div>
          </Plate>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TREINOS / DIETAS (shared queue pattern)
══════════════════════════════════════════════════════════════════════════ */
function QueueScreen({ mode }) {
  const ctx = useCtxSc(window.PanelCtx);
  const [qf, setQf] = useSc("todos");
  const ativos = useMSc(()=>MOCK_STUDENTS.filter(s=>s.active && !s.archived), []);
  const sorted = useMSc(()=>{
    const order = { critico:0, atencao:1, "sem-sinal":2, ok:3, pausado:4 };
    const list = qf==="todos" ? ativos : ativos.filter(s=>calcRisk(s)===qf);
    return [...list].sort((a,b)=>(order[calcRisk(a)]??9)-(order[calcRisk(b)]??9));
  }, [ativos, qf]);
  const counts = useMSc(()=>({
    critico:   ativos.filter(s=>calcRisk(s)==="critico").length,
    atencao:   ativos.filter(s=>calcRisk(s)==="atencao").length,
    "sem-sinal":ativos.filter(s=>calcRisk(s)==="sem-sinal").length,
  }), [ativos]);
  const FILTERS = [
    { id:"todos", label:"Todos" },
    { id:"critico",    label:"Críticos",  count:counts.critico   },
    { id:"atencao",    label:"Atenção",   count:counts.atencao   },
    { id:"sem-sinal",  label:"Sem sinal", count:counts["sem-sinal"] },
  ];
  const tab = mode === "treino" ? "treino" : "dieta";
  const actionLabel = mode === "treino" ? "Editar treino" : "Editar dieta";

  return (
    <div style={{ padding:"24px 28px" }}>
      <p style={{ fontFamily:T.mono, fontSize:11, color:T.fg3, marginBottom:14 }}>
        Alunos ordenados por urgência. Clique para editar {mode === "treino" ? "o treino" : "a dieta"} direto.
      </p>
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {FILTERS.map(({ id, label, count })=>(
          <button key={id} onClick={()=>setQf(id)} style={{
            height:32, padding:"0 14px", borderRadius:999, cursor:"pointer",
            border: qf===id ? `1px solid ${T.cyan}` : `1px solid ${T.border}`,
            background: qf===id ? T.cyan : "transparent",
            color: qf===id ? "#04131e" : T.fg3,
            fontFamily:T.mono, fontSize:9, fontWeight:900, letterSpacing:"0.18em", textTransform:"uppercase",
            display:"flex", alignItems:"center", gap:6,
          }}>
            {label}
            {count>0 && <span style={{
              background: qf===id ? "rgba(4,19,30,0.3)" : T.cyanSoft,
              color: qf===id ? "#04131e" : T.cyan,
              borderRadius:999, padding:"1px 6px", fontSize:8,
            }}>{count}</span>}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {sorted.map(s=>(
          <button key={s.id} onClick={()=>ctx.openStudent(s, tab)}
            style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              gap:16, padding:"16px 18px",
              background:T.panel, border:`1px solid ${T.border}`,
              borderRadius:14, cursor:"pointer", textAlign:"left",
              transition:"border-color 140ms ease",
            }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                <span style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.fg }}>{s.name}</span>
                <RiskPill student={s}/>
              </div>
              <span style={{ fontFamily:T.mono, fontSize:10, color:T.fg3 }}>
                {s.lastValidationAt ? `última validação ${relativeTime(s.lastValidationAt)}`
                  : s.lastActiveAt ? `visto ${relativeTime(s.lastActiveAt)}` : "sem sinal"}
              </span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
              <span style={{ fontFamily:T.mono, fontSize:10, color:T.fg3 }}>
                {mode==="treino" ? s.weeklyXp : s.monthlyXp} XP
              </span>
              <span style={{
                padding:"6px 12px", borderRadius:8,
                border:`1px solid ${T.cyanLine}`, background:T.cyanSoft,
                fontFamily:T.mono, fontSize:9, fontWeight:900, letterSpacing:"0.18em",
                color:T.cyan, textTransform:"uppercase",
              }}>{actionLabel} ›</span>
            </div>
          </button>
        ))}
        {!sorted.length && (
          <Plate style={{ padding:"48px 24px", textAlign:"center" }}>
            <div style={{ fontFamily:T.mono, fontSize:12, color:T.fg3 }}>Nenhum aluno nesta fila.</div>
          </Plate>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ARENA
══════════════════════════════════════════════════════════════════════════ */
function ArenaScreen() {
  const sections = [
    { title:"RANKING SEMANAL",  items:MOCK_RANKINGS.weekly  },
    { title:"RANKING MENSAL",   items:MOCK_RANKINGS.monthly },
    { title:"RANKING GERAL",    items:MOCK_RANKINGS.total   },
  ];
  return (
    <div style={{ padding:"24px 28px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
      {sections.map(({ title, items })=>(
        <Plate key={title} style={{ padding:"20px" }}>
          <Kicker cyan style={{ display:"block", marginBottom:16 }}>{title}</Kicker>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {items.map(item=>(
              <div key={item.userId} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                background:"rgba(0,0,0,0.20)", borderRadius:10, padding:"10px 14px",
              }}>
                <div>
                  <div style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.fg }}>
                    {item.position}º {item.pairName}
                  </div>
                  <div style={{ fontFamily:T.mono, fontSize:9, color:T.fg3, marginTop:2 }}>
                    {avatarLabel(item.avatarStage)}
                    {item.currentStreak ? ` · ${item.currentStreak}d streak` : ""}
                  </div>
                </div>
                <div style={{ fontFamily:T.mono, fontSize:14, fontWeight:900, color:T.cyan }}>
                  {item.xp.toLocaleString("pt-BR")} XP
                </div>
              </div>
            ))}
            {!items.length && <div style={{ fontFamily:T.mono, fontSize:11, color:T.fg3 }}>Sem ranking.</div>}
          </div>
        </Plate>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COACHES
══════════════════════════════════════════════════════════════════════════ */
function CoachesScreen() {
  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:10 }}>
      {MOCK_COACHES.map(coach=>(
        <Plate key={coach.userId} style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
            <div>
              <div style={{ fontFamily:T.mono, fontSize:14, fontWeight:900, color:T.fg, marginBottom:4 }}>
                {coach.name}
              </div>
              <div style={{ fontFamily:T.mono, fontSize:10, color:T.fg3, marginBottom:8 }}>
                {coach.email}
              </div>
              <Pill tone={coach.active ? "ok" : "mute"}>{coach.active ? "ATIVO" : "PAUSADO"}</Pill>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn ghost sm onClick={()=>{}}>{coach.active ? "Pausar" : "Ativar"}</Btn>
              <Btn danger sm onClick={()=>{}}><ITrash size={12}/></Btn>
            </div>
          </div>
        </Plate>
      ))}
      {!MOCK_COACHES.length && (
        <Plate style={{ padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontFamily:T.mono, fontSize:12, color:T.fg3 }}>Nenhum coach cadastrado.</div>
        </Plate>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIMES
══════════════════════════════════════════════════════════════════════════ */
function TimesScreen() {
  const [selected, setSelected] = useSc("t001");
  return (
    <div style={{ padding:"24px 28px" }}>
      <p style={{ fontFamily:T.mono, fontSize:11, color:T.fg3, marginBottom:16 }}>
        Selecione um Time para criar coaches e alunos nele.
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {MOCK_TEAMS.map(team=>{
          const isSel = selected === team.id;
          return (
            <Plate key={team.id} glow={isSel} style={{ padding:"18px 20px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                    <div style={{ fontFamily:T.mono, fontSize:14, fontWeight:900, color:isSel?T.cyan:T.fg }}>
                      {team.name}
                    </div>
                    {isSel && <Pill tone="cyan">SELECIONADO</Pill>}
                    <Pill tone={team.status==="active"?"ok":"mute"}>
                      {team.status==="active"?"ATIVO":"ARQUIVADO"}
                    </Pill>
                  </div>
                  <div style={{ fontFamily:T.mono, fontSize:10, color:T.fg3 }}>
                    {team.id} · {team.plan.toUpperCase()} · {team.usage.students} alunos · {team.usage.coaches} coaches
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Btn ghost sm onClick={()=>{}}>Editar</Btn>
                  <Btn cyan={!isSel} sm onClick={()=>setSelected(isSel?null:team.id)}>
                    {isSel ? "Desselecionar" : "Selecionar"}
                  </Btn>
                </div>
              </div>
            </Plate>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGS
══════════════════════════════════════════════════════════════════════════ */
function LogsScreen() {
  return (
    <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:8 }}>
      {MOCK_LOGS.map(log=>(
        <Plate key={log.id} dp style={{ padding:"12px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
            <div>
              <div style={{ fontFamily:T.mono, fontSize:11, fontWeight:900, color:T.fg,
                letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:4 }}>
                {log.action}
              </div>
              <div style={{ fontFamily:T.mono, fontSize:10, color:T.fg3 }}>
                {log.actorRole} · {log.actorUserId}
                {log.targetUserId && <span style={{ color:T.fg4 }}> → {log.targetUserId}</span>}
              </div>
            </div>
            <div style={{ fontFamily:T.mono, fontSize:9, color:T.fg4, flexShrink:0 }}>
              {new Date(log.timestamp).toLocaleString("pt-BR")}
            </div>
          </div>
        </Plate>
      ))}
    </div>
  );
}

/* ── TWEAKS ──────────────────────────────────────────────────────────────── */
function TweakRow({ label, hint, children }) {
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"1fr auto",
      alignItems:"center", gap:24,
      padding:"18px 22px",
      borderBottom:`1px solid ${T.border}`,
    }}>
      <div>
        <div style={{ fontFamily:T.mono, fontSize:11, fontWeight:900, color:T.fg, letterSpacing:"0.04em" }}>
          {label}
        </div>
        {hint && <div style={{ fontFamily:T.mono, fontSize:10, color:T.fg3, marginTop:4, lineHeight:1.5 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display:"inline-flex", gap:4, padding:4,
      background:"rgba(0,0,0,0.30)", border:`1px solid ${T.border}`, borderRadius:10 }}>
      {options.map(([val,label])=>{
        const active = value === val;
        return (
          <button key={String(val)} onClick={()=>onChange(val)} style={{
            height:30, padding:"0 14px", borderRadius:7, cursor:"pointer",
            background: active ? T.cyanSoft : "transparent",
            border:`1px solid ${active ? T.cyanLine : "transparent"}`,
            color: active ? T.cyan : T.fg3,
            fontFamily:T.mono, fontSize:9, fontWeight:900,
            letterSpacing:"0.18em", textTransform:"uppercase",
            transition:"all 140ms ease",
          }}>{label}</button>
        );
      })}
    </div>
  );
}

function Slider({ value, min=0, max=30, step=1, onChange, suffix="" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:14, minWidth:280 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))}
        style={{ flex:1, accentColor:T.cyan }}/>
      <div style={{ width:64, textAlign:"right",
        fontFamily:T.mono, fontSize:13, fontWeight:900, color:T.cyan,
        background:T.cyanSoft, border:`1px solid ${T.cyanLine}`,
        borderRadius:8, padding:"6px 10px",
      }}>
        {value}{suffix}
      </div>
    </div>
  );
}

function Swatches({ value, options, onChange }) {
  return (
    <div style={{ display:"flex", gap:8 }}>
      {options.map(opt=>{
        const active = value === opt.id;
        return (
          <button key={opt.id} onClick={()=>onChange(opt.id)} title={opt.label}
            style={{
              width:34, height:34, borderRadius:10, cursor:"pointer",
              background:opt.color, border:`2px solid ${active ? T.fg : "rgba(0,0,0,0.4)"}`,
              boxShadow: active ? `0 0 0 2px ${opt.color}55` : "none",
              transition:"all 140ms ease",
            }}/>
        );
      })}
    </div>
  );
}

function TweaksScreen() {
  const ctx = useCtxSc(window.PanelCtx);
  const t = ctx.tweaks ?? {};
  const set = ctx.setTweak;

  return (
    <div style={{ padding:"28px 32px 60px", maxWidth:920 }}>
      <div style={{ marginBottom:28 }}>
        <Kicker cyan>CONFIGURAÇÕES DO PAINEL</Kicker>
        <h2 style={{
          fontFamily:T.mono, fontSize:22, fontWeight:900, color:T.fg,
          marginTop:8, letterSpacing:"-0.01em",
        }}>Tweaks · ajustes do protótipo</h2>
        <p style={{ fontFamily:T.mono, fontSize:11, color:T.fg3, marginTop:6, lineHeight:1.6, maxWidth:640 }}>
          Estes controles afetam só a aparência e o comportamento do protótipo.
          As mudanças persistem no arquivo enquanto você itera o design.
        </p>
      </div>

      {/* Aparência */}
      <Plate style={{ marginBottom:20, overflow:"hidden" }}>
        <div style={{ padding:"16px 22px", borderBottom:`1px solid ${T.border}`,
          background:"rgba(82,231,255,0.04)" }}>
          <Kicker cyan>APARÊNCIA</Kicker>
        </div>
        <TweakRow label="Sidebar" hint="Estado inicial da navegação lateral.">
          <Segmented value={!!t.sidebarCollapsed} onChange={v=>set("sidebarCollapsed", v)}
            options={[[false,"Expandida"],[true,"Recolhida"]]}/>
        </TweakRow>
        <TweakRow label="Densidade" hint="Espaçamento das listas e tabelas.">
          <Segmented value={t.density ?? "normal"} onChange={v=>set("density", v)}
            options={[["compact","Compacta"],["normal","Normal"],["roomy","Espaçada"]]}/>
        </TweakRow>
        <TweakRow label="Cor de destaque" hint="Cor usada em pílulas, botões e estados ativos.">
          <Swatches value={t.accent ?? "cyan"} onChange={v=>set("accent", v)}
            options={[
              { id:"cyan",   label:"Ciano",   color:"#52e7ff" },
              { id:"violet", label:"Violeta", color:"#a78bfa" },
              { id:"lime",   label:"Lime",    color:"#bef264" },
              { id:"orange", label:"Âmbar",   color:"#fbbf24" },
            ]}/>
        </TweakRow>
        <TweakRow label="Brilho dos cards" hint="Intensidade dos efeitos de glow.">
          <Slider value={t.glow ?? 100} min={0} max={200} step={10} suffix="%"
            onChange={v=>set("glow", v)}/>
        </TweakRow>
      </Plate>

      {/* Régua de risco */}
      <Plate style={{ marginBottom:20, overflow:"hidden" }}>
        <div style={{ padding:"16px 22px", borderBottom:`1px solid ${T.border}`,
          background:"rgba(82,231,255,0.04)" }}>
          <Kicker cyan>RÉGUA DE RISCO</Kicker>
        </div>
        <TweakRow label="Limite de Atenção" hint="Dias sem treinar para entrar no estado “Atenção”.">
          <Slider value={t.atencaoDays ?? 3} min={1} max={14} suffix=" dias"
            onChange={v=>set("atencaoDays", v)}/>
        </TweakRow>
        <TweakRow label="Limite Crítico" hint="Dias sem treinar para entrar em “Crítico”.">
          <Slider value={t.criticoDays ?? 7} min={3} max={30} suffix=" dias"
            onChange={v=>set("criticoDays", v)}/>
        </TweakRow>
        <TweakRow label="Sem sinal" hint="Dias sem qualquer interação para considerar “Sem sinal”.">
          <Slider value={t.semSinalDays ?? 14} min={5} max={60} suffix=" dias"
            onChange={v=>set("semSinalDays", v)}/>
        </TweakRow>
      </Plate>

      {/* Mock data */}
      <Plate style={{ marginBottom:20, overflow:"hidden" }}>
        <div style={{ padding:"16px 22px", borderBottom:`1px solid ${T.border}`,
          background:"rgba(82,231,255,0.04)" }}>
          <Kicker cyan>DADOS DE DEMO</Kicker>
        </div>
        <TweakRow label="Mostrar +Aluno no header" hint="Esconde o CTA quando estiver fazendo prints limpos.">
          <Segmented value={!!(t.showCta ?? true)} onChange={v=>set("showCta", v)}
            options={[[true,"Visível"],[false,"Oculto"]]}/>
        </TweakRow>
        <TweakRow label="Animações" hint="Slide-in, fade e transições de abertura.">
          <Segmented value={!!(t.anim ?? true)} onChange={v=>set("anim", v)}
            options={[[true,"Ligadas"],[false,"Desligadas"]]}/>
        </TweakRow>
        <TweakRow label="Toolbar do host" hint="Mantém o toggle de Tweaks na barra superior do app.">
          <Segmented value={!!(t.hostToolbar ?? false)} onChange={v=>set("hostToolbar", v)}
            options={[[true,"Visível"],[false,"Oculto"]]}/>
        </TweakRow>
      </Plate>

      <div style={{ display:"flex", gap:10, marginTop:24 }}>
        <Btn ghost onClick={()=>ctx.resetTweaks?.()}>
          <ITrash size={13}/>Restaurar padrões
        </Btn>
        <div style={{ flex:1 }}/>
        <Pill tone="cyan">PERSISTIDO</Pill>
      </div>
    </div>
  );
}

/* ── ActiveScreen router ─────────────────────────────────────────────────── */
function ActiveScreen() {
  const ctx = useCtxSc(window.PanelCtx);
  switch(ctx.activeScreen) {
    case "hoje":     return <HojeScreen/>;
    case "students": return <AlunosScreen/>;
    case "treinos":  return <QueueScreen mode="treino"/>;
    case "dietas":   return <QueueScreen mode="dieta"/>;
    case "arena":    return <ArenaScreen/>;
    case "coaches":  return <CoachesScreen/>;
    case "teams":    return <TimesScreen/>;
    case "logs":     return <LogsScreen/>;
    case "tweaks":   return <TweaksScreen/>;
    default:         return null;
  }
}

Object.assign(window, { HojeScreen, AlunosScreen, QueueScreen, ArenaScreen,
  CoachesScreen, TimesScreen, LogsScreen, TweaksScreen, ActiveScreen, RiskPill, SubPill });
