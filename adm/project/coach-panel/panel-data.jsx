// GUTO Coach Panel — Mock Data + Helpers
// Shared via window.* — must load first.

const MOCK_STUDENTS = [
  { id:"u001", name:"Rafael Torres",    email:"rafael.torres@gmail.com",  phone:"+55 11 99999-0001", coachId:"c001", sex:"M", age:28, active:true,  archived:false, weeklyXp:840,  monthlyXp:3200, totalXp:12400, currentStreak:14, validationsTotal:86,  lastValidationAt:"2026-05-09T08:30:00Z", lastActiveAt:"2026-05-09T10:00:00Z", subscriptionStatus:"active",     subscriptionEndsAt:"2026-12-31", avatarStage:"adult", visibleInArena:true  },
  { id:"u002", name:"Ana Lima",          email:"ana.lima@outlook.com",     phone:"+55 11 98888-0002", coachId:"c001", sex:"F", age:24, active:true,  archived:false, weeklyXp:120,  monthlyXp:980,  totalXp:4200,  currentStreak:2,  validationsTotal:31,  lastValidationAt:"2026-05-06T14:20:00Z", lastActiveAt:"2026-05-07T09:15:00Z", subscriptionStatus:"active",     subscriptionEndsAt:"2026-09-30", avatarStage:"teen",  visibleInArena:true  },
  { id:"u003", name:"Bruno Mendes",      email:"bruno.m@hotmail.com",      phone:"+55 21 97777-0003", coachId:"c002", sex:"M", age:32, active:true,  archived:false, weeklyXp:0,    monthlyXp:200,  totalXp:7800,  currentStreak:0,  validationsTotal:54,  lastValidationAt:"2026-04-28T16:00:00Z", lastActiveAt:"2026-05-01T08:00:00Z", subscriptionStatus:"active",     subscriptionEndsAt:"2026-11-30", avatarStage:"adult", visibleInArena:false },
  { id:"u004", name:"Carla Ferreira",    email:"carla.f@gmail.com",        phone:"+55 31 96666-0004", coachId:"c001", sex:"F", age:29, active:true,  archived:false, weeklyXp:380,  monthlyXp:1600, totalXp:9100,  currentStreak:6,  validationsTotal:62,  lastValidationAt:"2026-05-08T07:45:00Z", lastActiveAt:"2026-05-09T11:30:00Z", subscriptionStatus:"active",     subscriptionEndsAt:"2026-08-31", avatarStage:"adult", visibleInArena:true  },
  { id:"u005", name:"Diego Santos",      email:"diego.s@email.com",        phone:"+55 41 95555-0005", coachId:"c002", sex:"M", age:35, active:false, archived:false, weeklyXp:0,    monthlyXp:0,    totalXp:2100,  currentStreak:0,  validationsTotal:18,  lastValidationAt:null,                   lastActiveAt:"2026-04-15T12:00:00Z", subscriptionStatus:"paused",     subscriptionEndsAt:null,         avatarStage:"teen",  visibleInArena:false },
  { id:"u006", name:"Fernanda Oliveira", email:"fe.oliv@gmail.com",        phone:"+55 11 94444-0006", coachId:"c001", sex:"F", age:22, active:true,  archived:false, weeklyXp:600,  monthlyXp:2400, totalXp:5600,  currentStreak:9,  validationsTotal:42,  lastValidationAt:"2026-05-09T06:15:00Z", lastActiveAt:"2026-05-09T09:30:00Z", subscriptionStatus:"active",     subscriptionEndsAt:"2026-07-31", avatarStage:"adult", visibleInArena:true  },
  { id:"u007", name:"Gabriel Costa",     email:"gab.costa@gmail.com",      phone:"+55 11 93333-0007", coachId:"c002", sex:"M", age:26, active:true,  archived:false, weeklyXp:0,    monthlyXp:100,  totalXp:1400,  currentStreak:0,  validationsTotal:12,  lastValidationAt:"2026-04-30T19:00:00Z", lastActiveAt:"2026-05-02T20:00:00Z", subscriptionStatus:"overdue",    subscriptionEndsAt:"2026-04-30", avatarStage:"baby",  visibleInArena:false },
  { id:"u008", name:"Helena Ramos",      email:"he.ramos@outlook.com",     phone:"+55 21 92222-0008", coachId:"c001", sex:"F", age:31, active:true,  archived:false, weeklyXp:1100, monthlyXp:4200, totalXp:18900, currentStreak:21, validationsTotal:124, lastValidationAt:"2026-05-09T07:00:00Z", lastActiveAt:"2026-05-09T08:45:00Z", subscriptionStatus:"active",     subscriptionEndsAt:"2027-01-31", avatarStage:"elite", visibleInArena:true  },
  { id:"u009", name:"Igor Batista",      email:"igor.b@gmail.com",         phone:"+55 51 91111-0009", coachId:"c002", sex:"M", age:27, active:true,  archived:false, weeklyXp:220,  monthlyXp:900,  totalXp:3300,  currentStreak:3,  validationsTotal:24,  lastValidationAt:"2026-05-07T20:00:00Z", lastActiveAt:"2026-05-08T21:00:00Z", subscriptionStatus:"active",     subscriptionEndsAt:"2026-10-31", avatarStage:"teen",  visibleInArena:true  },
  { id:"u010", name:"Juliana Melo",      email:"ju.melo@email.com",        phone:"+55 85 90000-0010", coachId:"c001", sex:"F", age:33, active:true,  archived:false, weeklyXp:0,    monthlyXp:50,   totalXp:880,   currentStreak:0,  validationsTotal:8,   lastValidationAt:"2026-04-22T11:00:00Z", lastActiveAt:"2026-04-25T14:00:00Z", subscriptionStatus:"active",     subscriptionEndsAt:"2026-06-30", avatarStage:"baby",  visibleInArena:false },
];

const MOCK_COACHES = [
  { userId:"c001", name:"Marcos Vieira",  email:"marcos@guto.fit",   role:"coach", active:true,  teamId:"t001" },
  { userId:"c002", name:"Patricia Nunes", email:"patricia@guto.fit", role:"coach", active:true,  teamId:"t001" },
  { userId:"c003", name:"Thiago Alves",   email:"thiago@guto.fit",   role:"coach", active:false, teamId:"t001" },
];

const MOCK_TEAMS = [
  { id:"t001", name:"Alpha Team", plan:"pro",    status:"active",   customLimits:null,                     usage:{ students:10, coaches:3 } },
  { id:"t002", name:"Beta Team",  plan:"start",  status:"active",   customLimits:null,                     usage:{ students:4,  coaches:1 } },
  { id:"t003", name:"Custom VIP", plan:"custom", status:"archived", customLimits:{ maxStudents:50, maxCoaches:8 }, usage:{ students:0, coaches:0 } },
];

const MOCK_LOGS = [
  { id:"l001", action:"student.workout.saved",         timestamp:"2026-05-09T08:45:00Z", actorRole:"coach",  actorUserId:"c001",      targetUserId:"u001" },
  { id:"l002", action:"student.diet.generated",        timestamp:"2026-05-09T08:20:00Z", actorRole:"system", actorUserId:"guto-ai",   targetUserId:"u006" },
  { id:"l003", action:"student.access.paused",         timestamp:"2026-05-08T15:30:00Z", actorRole:"admin",  actorUserId:"admin001",  targetUserId:"u005" },
  { id:"l004", action:"student.xp.weekly.reset",       timestamp:"2026-05-07T00:01:00Z", actorRole:"system", actorUserId:"scheduler", targetUserId:null   },
  { id:"l005", action:"student.created",               timestamp:"2026-05-06T11:15:00Z", actorRole:"coach",  actorUserId:"c001",      targetUserId:"u008" },
  { id:"l006", action:"coach.created",                 timestamp:"2026-05-05T09:00:00Z", actorRole:"admin",  actorUserId:"admin001",  targetUserId:"c002" },
  { id:"l007", action:"student.calibration.updated",   timestamp:"2026-05-04T14:22:00Z", actorRole:"coach",  actorUserId:"c002",      targetUserId:"u003" },
  { id:"l008", action:"student.workout.locked",        timestamp:"2026-05-03T10:10:00Z", actorRole:"coach",  actorUserId:"c001",      targetUserId:"u004" },
  { id:"l009", action:"team.plan.updated",             timestamp:"2026-05-02T16:00:00Z", actorRole:"admin",  actorUserId:"admin001",  targetUserId:null   },
  { id:"l010", action:"student.invite.regenerated",    timestamp:"2026-05-01T11:45:00Z", actorRole:"coach",  actorUserId:"c001",      targetUserId:"u007" },
];

const MOCK_RANKINGS = {
  weekly: [
    { userId:"u008", pairName:"Helena & GUTO",   xp:1100, avatarStage:"elite", position:1 },
    { userId:"u001", pairName:"Rafael & GUTO",   xp:840,  avatarStage:"adult", position:2 },
    { userId:"u006", pairName:"Fernanda & GUTO", xp:600,  avatarStage:"adult", position:3 },
    { userId:"u004", pairName:"Carla & GUTO",    xp:380,  avatarStage:"adult", position:4 },
    { userId:"u009", pairName:"Igor & GUTO",     xp:220,  avatarStage:"teen",  position:5 },
    { userId:"u002", pairName:"Ana & GUTO",      xp:120,  avatarStage:"teen",  position:6 },
  ],
  monthly: [
    { userId:"u008", pairName:"Helena & GUTO",   xp:4200, avatarStage:"elite", position:1 },
    { userId:"u001", pairName:"Rafael & GUTO",   xp:3200, avatarStage:"adult", position:2 },
    { userId:"u004", pairName:"Carla & GUTO",    xp:1600, avatarStage:"adult", position:3 },
    { userId:"u006", pairName:"Fernanda & GUTO", xp:2400, avatarStage:"adult", position:4 },
    { userId:"u009", pairName:"Igor & GUTO",     xp:900,  avatarStage:"teen",  position:5 },
  ],
  total: [
    { userId:"u008", pairName:"Helena & GUTO",   xp:18900, avatarStage:"elite", position:1, currentStreak:21 },
    { userId:"u001", pairName:"Rafael & GUTO",   xp:12400, avatarStage:"adult", position:2, currentStreak:14 },
    { userId:"u004", pairName:"Carla & GUTO",    xp:9100,  avatarStage:"adult", position:3, currentStreak:6  },
    { userId:"u003", pairName:"Bruno & GUTO",    xp:7800,  avatarStage:"adult", position:4, currentStreak:0  },
    { userId:"u006", pairName:"Fernanda & GUTO", xp:5600,  avatarStage:"adult", position:5, currentStreak:9  },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcRisk(s) {
  if (!s.active || s.archived) return "pausado";
  const last = s.lastValidationAt ?? s.lastActiveAt;
  if (!last) return "sem-sinal";
  const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
  if (days >= 7) return "critico";
  if (days >= 3) return "atencao";
  return "ok";
}

function relativeTime(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)  return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function coachName(coachId) {
  const c = MOCK_COACHES.find(c => c.userId === coachId);
  return c?.name ?? "—";
}

function subLabel(status) {
  return { active:"Ativo", paused:"Pausado", overdue:"Inadimplente", cancelled:"Cancelado", trial:"Trial" }[status] ?? status ?? "—";
}

function avatarLabel(stage) {
  return { baby:"BABY", teen:"TEEN", adult:"ADULT", elite:"ELITE" }[stage] ?? "—";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

Object.assign(window, {
  MOCK_STUDENTS, MOCK_COACHES, MOCK_TEAMS, MOCK_LOGS, MOCK_RANKINGS,
  calcRisk, relativeTime, coachName, subLabel, avatarLabel, formatDate,
});
