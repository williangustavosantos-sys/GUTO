// GUTO Coach Panel — Student Detail Panel (right-side overlay)
// 6 tabs: Resumo · Calibragem · Treino · Dieta · Histórico · Acesso

const { useState: useStP, useContext: useCtxSt } = React;

const DETAIL_TABS = [
  { id:"resumo",      label:"RESUMO",     Icon: ()=><IUsers size={13}/> },
  { id:"calibragem",  label:"CALIBRAGEM", Icon: ()=><ICalib size={13}/> },
  { id:"treino",      label:"TREINO",     Icon: ()=><IDumbbell size={13}/> },
  { id:"dieta",       label:"DIETA",      Icon: ()=><IFork size={13}/> },
  { id:"historico",   label:"HISTÓRICO",  Icon: ()=><IHist size={13}/> },
  { id:"acesso",      label:"ACESSO",     Icon: ()=><ILock size={13}/> },
];

/* ── Resumo ──────────────────────────────────────────────────────────────── */
function TabResumo({ student }) {
  const RESETS = ["Resetar semana","Resetar mês","Resetar XP total","Resetar validações"];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Plate dp style={{ padding:"18px 20px" }}>
        <Kicker cyan style={{ display:"block", marginBottom:14 }}>PERFIL</Kicker>
        <DataRow label="Status"      value={<SubPill status={student.subscriptionStatus}/>}/>
        <DataRow label="Email"       value={student.email}/>
        <DataRow label="Telefone"    value={student.phone}/>
        <DataRow label="Sexo / Idade" value={`${student.sex === "M" ? "Masc." : "Fem."} · ${student.age} anos`}/>
        <DataRow label="Coach"       value={coachName(student.coachId)}/>
        <DataRow label="Arena"       value={student.visibleInArena ? "Visível" : "Oculto"}/>
        <DataRow label="Plano expira" value={formatDate(student.subscriptionEndsAt)}/>
      </Plate>

      <Plate dp style={{ padding:"18px 20px" }}>
        <Kicker cyan style={{ display:"block", marginBottom:14 }}>EVOLUÇÃO</Kicker>
        <DataRow label="XP semanal"   value={<span style={{ color:T.cyan, fontWeight:900 }}>{student.weeklyXp} XP</span>}/>
        <DataRow label="XP mensal"    value={`${student.monthlyXp} XP`}/>
        <DataRow label="XP total"     value={`${student.totalXp.toLocaleString("pt-BR")} XP`}/>
        <DataRow label="Sequência"    value={`${student.currentStreak}d`}/>
        <DataRow label="Validações"   value={student.validationsTotal}/>
        <DataRow label="Avatar"       value={<Pill tone="cyan">{avatarLabel(student.avatarStage)}</Pill>}/>
      </Plate>

      <Plate dp style={{ padding:"18px 20px", gridColumn:"1/-1" }}>
        <Kicker cyan style={{ display:"block", marginBottom:10 }}>RESET ARENA / XP</Kicker>
        <p style={{ fontFamily:T.mono, fontSize:10, color:T.fg3, marginBottom:12 }}>
          Ações irreversíveis. Use com cuidado.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {RESETS.map(label=>(
            <Btn key={label} danger sm onClick={()=>{}}
              style={{ justifyContent:"center", textAlign:"center", height:36, fontSize:9, padding:"0 10px" }}>
              {label}
            </Btn>
          ))}
        </div>
      </Plate>
    </div>
  );
}

/* ── Calibragem ──────────────────────────────────────────────────────────── */
function TabCalibragem({ student }) {
  const mockCalib = {
    objetivo:"Hipertrofia", local:"Academia completa",
    diasSemana:4, peso:"82kg", altura:"178cm",
    experiencia:"Intermediário", lesoes:"Nenhuma",
    dieta:"Ganho de massa", restricoes:"Lactose",
  };
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Plate dp style={{ padding:"18px 20px" }}>
        <Kicker cyan style={{ display:"block", marginBottom:14 }}>CORPO</Kicker>
        <DataRow label="Peso atual"   value={mockCalib.peso}/>
        <DataRow label="Altura"       value={mockCalib.altura}/>
        <DataRow label="Experiência"  value={mockCalib.experiencia}/>
        <DataRow label="Lesões"       value={mockCalib.lesoes}/>
      </Plate>
      <Plate dp style={{ padding:"18px 20px" }}>
        <Kicker cyan style={{ display:"block", marginBottom:14 }}>TREINO</Kicker>
        <DataRow label="Objetivo"     value={mockCalib.objetivo}/>
        <DataRow label="Local"        value={mockCalib.local}/>
        <DataRow label="Dias / semana" value={`${mockCalib.diasSemana}x`}/>
      </Plate>
      <Plate dp style={{ padding:"18px 20px" }}>
        <Kicker cyan style={{ display:"block", marginBottom:14 }}>DIETA</Kicker>
        <DataRow label="Protocolo"    value={mockCalib.dieta}/>
        <DataRow label="Restrições"   value={mockCalib.restricoes}/>
      </Plate>
      <Plate dp style={{ padding:"18px 20px", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:10 }}>
        <p style={{ fontFamily:T.mono, fontSize:11, color:T.fg3, textAlign:"center" }}>
          Dados de calibragem coletados no onboarding e atualizados via chat.
        </p>
        <Btn ghost sm onClick={()=>{}}>Editar calibragem</Btn>
      </Plate>
    </div>
  );
}

/* ── Treino ──────────────────────────────────────────────────────────────── */
function TabTreino({ student }) {
  const [subtab, setSubtab] = useStP("oficial");
  const mockWorkout = {
    title:"Peito + Tríceps", focus:"Hipertrofia", source:"coach_manual",
    locked:true, location:"Academia", day:"Terça-feira",
    duration:60, difficulty:"Intermediário",
    exercises:[
      { name:"Supino reto com barra", sets:4, reps:"8-10", load:"80kg", rest:"90s" },
      { name:"Crucifixo inclinado",   sets:3, reps:"12",   load:"20kg", rest:"60s" },
      { name:"Supino inclinado halteres", sets:3, reps:"10", load:"28kg", rest:"75s" },
      { name:"Tríceps testa",         sets:3, reps:"12",   load:"30kg", rest:"60s" },
      { name:"Mergulho no paralelo",  sets:3, reps:"15",   load:"corpo", rest:"60s" },
    ],
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Sub-tab toggle */}
      <div style={{ display:"flex", gap:4, background:"rgba(0,0,0,0.25)", borderRadius:10,
        padding:4, border:`1px solid ${T.border}` }}>
        {["oficial","semana"].map(t=>(
          <button key={t} onClick={()=>setSubtab(t)} style={{
            flex:1, height:32, borderRadius:7, cursor:"pointer",
            background: subtab===t ? T.cyan : "transparent",
            color: subtab===t ? "#04131e" : T.fg3,
            border:"none", fontFamily:T.mono, fontSize:9, fontWeight:900,
            letterSpacing:"0.18em", textTransform:"uppercase",
          }}>
            {t==="oficial" ? "Treino oficial" : "Plano semanal"}
          </button>
        ))}
      </div>

      {subtab === "oficial" && (
        <Plate dp style={{ padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <div style={{ fontFamily:T.mono, fontSize:14, fontWeight:900, color:T.fg, marginBottom:4 }}>
                {mockWorkout.title}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <Pill tone="cyan">{mockWorkout.source === "coach_manual" ? "COACH" : "GUTO"}</Pill>
                {mockWorkout.locked && <Pill tone="warn"><ILock size={9}/>BLOQUEADO</Pill>}
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn ghost sm onClick={()=>{}}><ISave size={12}/>Salvar</Btn>
              <Btn ghost sm onClick={()=>{}}>{mockWorkout.locked ? "Desbloquear" : "Bloquear"}</Btn>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
            {[["Foco",mockWorkout.focus],["Dia",mockWorkout.day],["Local",mockWorkout.location],
              ["Duração",`${mockWorkout.duration}min`],["Dificuldade",mockWorkout.difficulty]].map(([l,v])=>(
              <div key={l} style={{ background:"rgba(0,0,0,0.20)", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontFamily:T.mono, fontSize:9, color:T.fg4, letterSpacing:"0.20em",
                  textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                <div style={{ fontFamily:T.mono, fontSize:11, fontWeight:700, color:T.fg }}>{v}</div>
              </div>
            ))}
          </div>
          <Kicker cyan style={{ display:"block", marginBottom:10 }}>EXERCÍCIOS</Kicker>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {mockWorkout.exercises.map((ex,i)=>(
              <div key={i} style={{ display:"grid",
                gridTemplateColumns:"20px 1fr 50px 50px 50px 50px",
                alignItems:"center", gap:12,
                background:"rgba(0,0,0,0.20)", borderRadius:8, padding:"10px 14px",
              }}>
                <span style={{ fontFamily:T.mono, fontSize:9, color:T.fg4, fontWeight:900 }}>
                  {String(i+1).padStart(2,"0")}
                </span>
                <span style={{ fontFamily:T.mono, fontSize:11, fontWeight:700, color:T.fg }}>{ex.name}</span>
                <div><div style={{ fontFamily:T.mono, fontSize:8, color:T.fg4, textTransform:"uppercase", letterSpacing:"0.14em" }}>Séries</div>
                  <div style={{ fontFamily:T.mono, fontSize:11, color:T.fg2 }}>{ex.sets}</div></div>
                <div><div style={{ fontFamily:T.mono, fontSize:8, color:T.fg4, textTransform:"uppercase", letterSpacing:"0.14em" }}>Reps</div>
                  <div style={{ fontFamily:T.mono, fontSize:11, color:T.fg2 }}>{ex.reps}</div></div>
                <div><div style={{ fontFamily:T.mono, fontSize:8, color:T.fg4, textTransform:"uppercase", letterSpacing:"0.14em" }}>Carga</div>
                  <div style={{ fontFamily:T.mono, fontSize:11, color:T.fg2 }}>{ex.load}</div></div>
                <div><div style={{ fontFamily:T.mono, fontSize:8, color:T.fg4, textTransform:"uppercase", letterSpacing:"0.14em" }}>Desc.</div>
                  <div style={{ fontFamily:T.mono, fontSize:11, color:T.fg2 }}>{ex.rest}</div></div>
              </div>
            ))}
          </div>
          <Btn ghost sm onClick={()=>{}} style={{ marginTop:14 }}><IPlus size={12}/>Adicionar exercício</Btn>
        </Plate>
      )}

      {subtab === "semana" && (
        <Plate dp style={{ padding:"18px 20px" }}>
          <p style={{ fontFamily:T.mono, fontSize:10, color:T.fg3, marginBottom:14 }}>
            Monte o treino de cada dia. O aluno vê apenas o dia atual no app.
          </p>
          {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map((d,i)=>(
            <div key={d} style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"12px 14px", marginBottom:6,
              background:"rgba(0,0,0,0.20)", borderRadius:10,
              border:`1px solid ${T.border}`,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontFamily:T.mono, fontSize:9, fontWeight:900, color:T.fg4,
                  letterSpacing:"0.20em", width:28 }}>{d}</span>
                <span style={{ fontFamily:T.mono, fontSize:11, color:T.fg2 }}>
                  {i===0?"Peito + Tríceps":i===1?"Costas + Bíceps":i===2?"Pernas":i===4?"Ombro + Abdômen":"Descanso"}
                </span>
                {i<2||i===2||i===4 ?
                  <Pill tone="cyan" style={{ fontSize:8 }}>
                    {i===0?5:i===1?5:i===2?6:4} ex.
                  </Pill> : null}
              </div>
              <Btn ghost sm onClick={()=>{}} style={{ fontSize:8 }}>Editar</Btn>
            </div>
          ))}
          <Btn cyan sm onClick={()=>{}} style={{ marginTop:10 }}><ISave size={12}/>Salvar plano semanal</Btn>
        </Plate>
      )}
    </div>
  );
}

/* ── Dieta ───────────────────────────────────────────────────────────────── */
function TabDieta({ student }) {
  const meals = [
    { name:"Café da manhã", kcal:480, items:["Ovos mexidos (3)","Pão integral (2 fatias)","Banana"] },
    { name:"Almoço",        kcal:720, items:["Frango grelhado 150g","Arroz integral 150g","Salada verde"] },
    { name:"Pré-treino",    kcal:280, items:["Whey protein 30g","Batata doce 100g"] },
    { name:"Jantar",        kcal:540, items:["Salmão 180g","Brócolis 120g","Arroz integral 100g"] },
  ];
  const total = meals.reduce((a,m)=>a+m.kcal,0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Plate dp style={{ padding:"14px 18px", display:"flex", gap:24, alignItems:"center" }}>
        <div>
          <Kicker style={{ display:"block", marginBottom:4 }}>TOTAL DIÁRIO</Kicker>
          <span style={{ fontFamily:T.mono, fontSize:28, fontWeight:900, color:T.cyan }}>{total}</span>
          <span style={{ fontFamily:T.mono, fontSize:12, color:T.fg3 }}> kcal</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Pill tone="cyan">COACH MANUAL</Pill>
          <Pill tone="ok">GUTO PODE ATUALIZAR</Pill>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <Btn ghost sm onClick={()=>{}}>Gerar com GUTO</Btn>
          <Btn cyan sm onClick={()=>{}}><ISave size={12}/>Salvar</Btn>
        </div>
      </Plate>
      {meals.map(meal=>(
        <Plate key={meal.name} dp style={{ padding:"14px 18px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontFamily:T.mono, fontSize:12, fontWeight:900, color:T.fg }}>{meal.name}</span>
            <span style={{ fontFamily:T.mono, fontSize:11, color:T.cyan, fontWeight:700 }}>{meal.kcal} kcal</span>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {meal.items.map(item=>(
              <span key={item} style={{ fontFamily:T.mono, fontSize:9, color:T.fg2,
                background:"rgba(0,0,0,0.25)", border:`1px solid ${T.border}`,
                borderRadius:6, padding:"4px 10px" }}>{item}</span>
            ))}
          </div>
        </Plate>
      ))}
    </div>
  );
}

/* ── Histórico ───────────────────────────────────────────────────────────── */
function TabHistorico({ student }) {
  const entries = [
    { date:"2026-05-09", label:"Peito + Tríceps",  xp:120, status:"ok" },
    { date:"2026-05-08", label:"Costas + Bíceps",  xp:110, status:"ok" },
    { date:"2026-05-07", label:"Pernas",            xp:130, status:"ok" },
    { date:"2026-05-05", label:"Ombro + Abdômen",  xp:100, status:"ok" },
    { date:"2026-05-04", label:"Cardio leve",       xp:60,  status:"ok" },
    { date:"2026-05-01", label:"Peito + Tríceps",  xp:120, status:"ok" },
    { date:"2026-04-30", label:"Costas",            xp:110, status:"ok" },
    { date:"2026-04-28", label:"Ausência",          xp:0,   status:"bad" },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {entries.map((e,i)=>(
        <div key={i} style={{
          display:"flex", alignItems:"center", gap:16,
          padding:"12px 16px", background:T.panelDp,
          border:`1px solid ${T.border}`, borderRadius:10,
        }}>
          <div style={{ width:8, height:8, borderRadius:999, flexShrink:0,
            background: e.status==="ok" ? T.ok : T.bad,
            boxShadow: `0 0 6px ${e.status==="ok" ? T.ok : T.bad}`,
          }}/>
          <span style={{ fontFamily:T.mono, fontSize:11, color:T.fg3, width:80, flexShrink:0 }}>
            {new Date(e.date).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
          </span>
          <span style={{ fontFamily:T.mono, fontSize:12, fontWeight:700, color:T.fg, flex:1 }}>
            {e.label}
          </span>
          {e.xp > 0 && (
            <span style={{ fontFamily:T.mono, fontSize:11, color:T.cyan, fontWeight:900 }}>
              +{e.xp} XP
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Acesso ──────────────────────────────────────────────────────────────── */
function TabAcesso({ student }) {
  const [active, setActive] = useStP(student.active);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <Plate dp style={{ padding:"20px" }}>
        <Kicker cyan style={{ display:"block", marginBottom:14 }}>STATUS DE ACESSO</Kicker>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:T.mono, fontSize:14, fontWeight:900,
              color: active ? T.ok : T.bad, marginBottom:6 }}>
              {active ? "Acesso liberado" : "Acesso pausado"}
            </div>
            <div style={{ fontFamily:T.mono, fontSize:10, color:T.fg3 }}>
              {active ? "O aluno pode acessar o app normalmente." : "O aluno não consegue entrar no app."}
            </div>
          </div>
          <Btn danger={active} cyan={!active} onClick={()=>setActive(v=>!v)}>
            {active ? "Pausar acesso" : "Liberar acesso"}
          </Btn>
        </div>
      </Plate>

      <Plate dp style={{ padding:"20px" }}>
        <Kicker cyan style={{ display:"block", marginBottom:14 }}>LINK DE CONVITE</Kicker>
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          background:"rgba(0,0,0,0.30)", border:`1px solid ${T.border}`,
          borderRadius:8, padding:"10px 14px",
        }}>
          <span style={{ fontFamily:T.mono, fontSize:10, color:T.fg3, flex:1,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            https://guto.fit/convite/abc123xyz{student.id}
          </span>
          <button onClick={()=>{}} style={{
            background:T.cyanSoft, border:`1px solid ${T.cyanLine}`,
            borderRadius:6, padding:"6px 10px", cursor:"pointer",
            color:T.cyan, display:"flex", alignItems:"center", gap:6,
            fontFamily:T.mono, fontSize:9, fontWeight:900,
          }}>
            <ICopy size={12}/>COPIAR
          </button>
        </div>
        <Btn ghost sm onClick={()=>{}} style={{ marginTop:10 }}>Regenerar convite</Btn>
      </Plate>

      <Plate dp style={{ padding:"20px" }}>
        <Kicker cyan style={{ display:"block", marginBottom:14 }}>ASSINATURA</Kicker>
        <DataRow label="Status"      value={<SubPill status={student.subscriptionStatus}/>}/>
        <DataRow label="Expira em"   value={formatDate(student.subscriptionEndsAt)}/>
        <DataRow label="Arena"       value={student.visibleInArena ? "Visível" : "Oculto"}/>
        <div style={{ marginTop:12, display:"flex", gap:8 }}>
          <Btn ghost sm onClick={()=>{}}>
            {student.visibleInArena ? "Ocultar da Arena" : "Mostrar na Arena"}
          </Btn>
        </div>
      </Plate>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STUDENT PANEL (overlay)
══════════════════════════════════════════════════════════════════════════ */
function StudentPanel() {
  const ctx = useCtxSt(window.PanelCtx);
  const { selectedStudent, detailTab, setDetailTab, closeStudent } = ctx;

  if (!selectedStudent) return null;
  const s = selectedStudent;
  const risk = calcRisk(s);
  const riskColor = { ok:T.ok, atencao:T.warn, critico:T.bad, "sem-sinal":T.fg3, pausado:T.fg4 }[risk] ?? T.fg3;

  return (
    <>
      {/* Backdrop */}
      <div onClick={closeStudent} style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
        backdropFilter:"blur(2px)", zIndex:40,
      }}/>
      {/* Panel */}
      <div style={{
        position:"fixed", top:0, right:0, bottom:0, width:680,
        background:`linear-gradient(180deg, #080e1c 0%, #060912 100%)`,
        borderLeft:`1px solid ${T.border}`,
        boxShadow:"-20px 0 60px rgba(0,0,0,0.6)",
        zIndex:50, display:"flex", flexDirection:"column",
        overflow:"hidden",
      }}>
        {/* Panel header */}
        <div style={{
          padding:"20px 24px 0",
          borderBottom:`1px solid ${T.border}`,
          flexShrink:0,
        }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <Pill tone="cyan">STUDENT</Pill>
                <span style={{ fontFamily:T.mono, fontSize:9, color:T.fg4 }}>{s.id}</span>
              </div>
              <h2 style={{ fontFamily:T.mono, fontSize:22, fontWeight:900, color:T.fg,
                margin:0, letterSpacing:"-0.01em" }}>{s.name}</h2>
              <div style={{ fontFamily:T.mono, fontSize:10, color:T.fg3, marginTop:4 }}>
                {s.email} · {coachName(s.coachId)}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ textAlign:"right" }}>
                <RiskPill student={s}/>
                <div style={{ fontFamily:T.mono, fontSize:11, fontWeight:900,
                  color:riskColor, marginTop:6 }}>
                  {s.weeklyXp} XP / semana
                </div>
              </div>
              <button onClick={closeStudent} style={{
                background:"rgba(232,244,255,0.06)", border:`1px solid ${T.border}`,
                borderRadius:8, width:36, height:36, cursor:"pointer",
                color:T.fg3, display:"grid", placeItems:"center",
              }}><IX size={14}/></button>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display:"flex", gap:2, overflowX:"auto", paddingBottom:0 }}>
            {DETAIL_TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setDetailTab(tab.id)}
                style={{
                  height:38, padding:"0 14px",
                  background: detailTab===tab.id ? T.cyanSoft : "transparent",
                  border:`1px solid ${detailTab===tab.id ? T.cyanLine : "transparent"}`,
                  borderBottom: detailTab===tab.id ? `1px solid ${T.cyan}` : "1px solid transparent",
                  borderRadius:"8px 8px 0 0",
                  cursor:"pointer",
                  color: detailTab===tab.id ? T.cyan : T.fg3,
                  fontFamily:T.mono, fontSize:9, fontWeight:900,
                  letterSpacing:"0.18em", textTransform:"uppercase",
                  display:"flex", alignItems:"center", gap:6,
                  transition:"all 140ms ease",
                  whiteSpace:"nowrap",
                }}>
                <tab.Icon/>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          {detailTab==="resumo"     && <TabResumo student={s}/>}
          {detailTab==="calibragem" && <TabCalibragem student={s}/>}
          {detailTab==="treino"     && <TabTreino student={s}/>}
          {detailTab==="dieta"      && <TabDieta student={s}/>}
          {detailTab==="historico"  && <TabHistorico student={s}/>}
          {detailTab==="acesso"     && <TabAcesso student={s}/>}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { StudentPanel });
