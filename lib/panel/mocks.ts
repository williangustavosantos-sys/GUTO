import type {
  Coach,
  Empresa,
  ExercisePending,
  FoodPending,
  LogEntry,
  Rankings,
  Student,
  SysTelemetry,
  Team,
} from "./types"

// Direct port of design_handoff_guto_coach_panel/panel-data.jsx + sala-data.jsx.
// Used only for the visual approval phase; replaced by real API in Phase 2.

export const MOCK_STUDENTS: Student[] = [
  { id: "u001", name: "Rafael Torres",    email: "rafael.torres@gmail.com", phone: "+55 11 99999-0001", coachId: "c001", sex: "M", age: 28, active: true,  archived: false, weeklyXp: 840,  monthlyXp: 3200, totalXp: 12400, currentStreak: 14, validationsTotal: 86,  lastValidationAt: "2026-05-17T08:30:00Z", lastActiveAt: "2026-05-18T10:00:00Z", subscriptionStatus: "active",  subscriptionEndsAt: "2026-12-31", avatarStage: "adult", visibleInArena: true  },
  { id: "u002", name: "Ana Lima",         email: "ana.lima@outlook.com",    phone: "+55 11 98888-0002", coachId: "c001", sex: "F", age: 24, active: true,  archived: false, weeklyXp: 120,  monthlyXp: 980,  totalXp: 4200,  currentStreak: 2,  validationsTotal: 31,  lastValidationAt: "2026-05-15T14:20:00Z", lastActiveAt: "2026-05-16T09:15:00Z", subscriptionStatus: "active",  subscriptionEndsAt: "2026-09-30", avatarStage: "teen",  visibleInArena: true  },
  { id: "u003", name: "Bruno Mendes",     email: "bruno.m@hotmail.com",     phone: "+55 21 97777-0003", coachId: "c002", sex: "M", age: 32, active: true,  archived: false, weeklyXp: 0,    monthlyXp: 200,  totalXp: 7800,  currentStreak: 0,  validationsTotal: 54,  lastValidationAt: "2026-05-09T16:00:00Z", lastActiveAt: "2026-05-10T08:00:00Z", subscriptionStatus: "active",  subscriptionEndsAt: "2026-11-30", avatarStage: "adult", visibleInArena: false },
  { id: "u004", name: "Carla Ferreira",   email: "carla.f@gmail.com",       phone: "+55 31 96666-0004", coachId: "c001", sex: "F", age: 29, active: true,  archived: false, weeklyXp: 380,  monthlyXp: 1600, totalXp: 9100,  currentStreak: 6,  validationsTotal: 62,  lastValidationAt: "2026-05-16T07:45:00Z", lastActiveAt: "2026-05-18T11:30:00Z", subscriptionStatus: "active",  subscriptionEndsAt: "2026-08-31", avatarStage: "adult", visibleInArena: true  },
  { id: "u005", name: "Diego Santos",     email: "diego.s@email.com",       phone: "+55 41 95555-0005", coachId: "c002", sex: "M", age: 35, active: false, archived: false, weeklyXp: 0,    monthlyXp: 0,    totalXp: 2100,  currentStreak: 0,  validationsTotal: 18,  lastValidationAt: null,                   lastActiveAt: "2026-04-15T12:00:00Z", subscriptionStatus: "paused",  subscriptionEndsAt: null,         avatarStage: "teen",  visibleInArena: false },
  { id: "u006", name: "Fernanda Oliveira",email: "fe.oliv@gmail.com",       phone: "+55 11 94444-0006", coachId: "c001", sex: "F", age: 22, active: true,  archived: false, weeklyXp: 600,  monthlyXp: 2400, totalXp: 5600,  currentStreak: 9,  validationsTotal: 42,  lastValidationAt: "2026-05-18T06:15:00Z", lastActiveAt: "2026-05-18T09:30:00Z", subscriptionStatus: "active",  subscriptionEndsAt: "2026-07-31", avatarStage: "adult", visibleInArena: true  },
  { id: "u007", name: "Gabriel Costa",    email: "gab.costa@gmail.com",     phone: "+55 11 93333-0007", coachId: "c002", sex: "M", age: 26, active: true,  archived: false, weeklyXp: 0,    monthlyXp: 100,  totalXp: 1400,  currentStreak: 0,  validationsTotal: 12,  lastValidationAt: "2026-05-08T19:00:00Z", lastActiveAt: "2026-05-10T20:00:00Z", subscriptionStatus: "overdue", subscriptionEndsAt: "2026-04-30", avatarStage: "baby",  visibleInArena: false },
  { id: "u008", name: "Helena Ramos",     email: "he.ramos@outlook.com",    phone: "+55 21 92222-0008", coachId: "c001", sex: "F", age: 31, active: true,  archived: false, weeklyXp: 1100, monthlyXp: 4200, totalXp: 18900, currentStreak: 21, validationsTotal: 124, lastValidationAt: "2026-05-18T07:00:00Z", lastActiveAt: "2026-05-18T08:45:00Z", subscriptionStatus: "active",  subscriptionEndsAt: "2027-01-31", avatarStage: "elite", visibleInArena: true  },
  // Patched per sala-data.jsx: u009 / u010 → c003 to honour the empresa hierarchy.
  { id: "u009", name: "Igor Batista",     email: "igor.b@gmail.com",        phone: "+55 51 91111-0009", coachId: "c003", sex: "M", age: 27, active: true,  archived: false, weeklyXp: 220,  monthlyXp: 900,  totalXp: 3300,  currentStreak: 3,  validationsTotal: 24,  lastValidationAt: "2026-05-14T20:00:00Z", lastActiveAt: "2026-05-15T21:00:00Z", subscriptionStatus: "active",  subscriptionEndsAt: "2026-10-31", avatarStage: "teen",  visibleInArena: true  },
  { id: "u010", name: "Juliana Melo",     email: "ju.melo@email.com",       phone: "+55 85 90000-0010", coachId: "c003", sex: "F", age: 33, active: true,  archived: false, weeklyXp: 0,    monthlyXp: 50,   totalXp: 880,   currentStreak: 0,  validationsTotal: 8,   lastValidationAt: "2026-05-10T11:00:00Z", lastActiveAt: "2026-05-12T14:00:00Z", subscriptionStatus: "active",  subscriptionEndsAt: "2026-06-30", avatarStage: "baby",  visibleInArena: false },
]

export const MOCK_COACHES: Coach[] = [
  { userId: "c001", name: "Marcos Vieira",  email: "marcos@guto.fit",   role: "coach", active: true,  teamId: "t001" },
  { userId: "c002", name: "Patricia Nunes", email: "patricia@guto.fit", role: "coach", active: true,  teamId: "t001" },
  { userId: "c003", name: "Thiago Alves",   email: "thiago@guto.fit",   role: "coach", active: false, teamId: "t001" },
]

export const MOCK_TEAMS: Team[] = [
  { id: "t001", name: "Alpha Team", plan: "pro",    status: "active",   customLimits: null,                                 usage: { students: 10, coaches: 3 } },
  { id: "t002", name: "Beta Team",  plan: "start",  status: "active",   customLimits: null,                                 usage: { students: 4,  coaches: 1 } },
  { id: "t003", name: "Custom VIP", plan: "custom", status: "archived", customLimits: { maxStudents: 50, maxCoaches: 8 },   usage: { students: 0, coaches: 0 } },
]

export const MOCK_LOGS: LogEntry[] = [
  { id: "l001", action: "student.workout.saved",       timestamp: "2026-05-09T08:45:00Z", actorRole: "coach",  actorUserId: "c001",      targetUserId: "u001" },
  { id: "l002", action: "student.diet.generated",      timestamp: "2026-05-09T08:20:00Z", actorRole: "system", actorUserId: "guto-ai",   targetUserId: "u006" },
  { id: "l003", action: "student.access.paused",       timestamp: "2026-05-08T15:30:00Z", actorRole: "admin",  actorUserId: "admin001",  targetUserId: "u005" },
  { id: "l004", action: "student.xp.weekly.reset",     timestamp: "2026-05-07T00:01:00Z", actorRole: "system", actorUserId: "scheduler", targetUserId: null   },
  { id: "l005", action: "student.created",             timestamp: "2026-05-06T11:15:00Z", actorRole: "coach",  actorUserId: "c001",      targetUserId: "u008" },
  { id: "l006", action: "coach.created",               timestamp: "2026-05-05T09:00:00Z", actorRole: "admin",  actorUserId: "admin001",  targetUserId: "c002" },
  { id: "l007", action: "student.calibration.updated", timestamp: "2026-05-04T14:22:00Z", actorRole: "coach",  actorUserId: "c002",      targetUserId: "u003" },
  { id: "l008", action: "student.workout.locked",      timestamp: "2026-05-03T10:10:00Z", actorRole: "coach",  actorUserId: "c001",      targetUserId: "u004" },
  { id: "l009", action: "team.plan.updated",           timestamp: "2026-05-02T16:00:00Z", actorRole: "admin",  actorUserId: "admin001",  targetUserId: null   },
  { id: "l010", action: "student.invite.regenerated",  timestamp: "2026-05-01T11:45:00Z", actorRole: "coach",  actorUserId: "c001",      targetUserId: "u007" },
]

export const MOCK_RANKINGS: Rankings = {
  weekly: [
    { userId: "u008", pairName: "Helena & GUTO",   xp: 1100, avatarStage: "elite", position: 1 },
    { userId: "u001", pairName: "Rafael & GUTO",   xp: 840,  avatarStage: "adult", position: 2 },
    { userId: "u006", pairName: "Fernanda & GUTO", xp: 600,  avatarStage: "adult", position: 3 },
    { userId: "u004", pairName: "Carla & GUTO",    xp: 380,  avatarStage: "adult", position: 4 },
    { userId: "u009", pairName: "Igor & GUTO",     xp: 220,  avatarStage: "teen",  position: 5 },
    { userId: "u002", pairName: "Ana & GUTO",      xp: 120,  avatarStage: "teen",  position: 6 },
  ],
  monthly: [
    { userId: "u008", pairName: "Helena & GUTO",   xp: 4200, avatarStage: "elite", position: 1 },
    { userId: "u001", pairName: "Rafael & GUTO",   xp: 3200, avatarStage: "adult", position: 2 },
    { userId: "u004", pairName: "Carla & GUTO",    xp: 1600, avatarStage: "adult", position: 3 },
    { userId: "u006", pairName: "Fernanda & GUTO", xp: 2400, avatarStage: "adult", position: 4 },
    { userId: "u009", pairName: "Igor & GUTO",     xp: 900,  avatarStage: "teen",  position: 5 },
  ],
  total: [
    { userId: "u008", pairName: "Helena & GUTO",   xp: 18900, avatarStage: "elite", position: 1, currentStreak: 21 },
    { userId: "u001", pairName: "Rafael & GUTO",   xp: 12400, avatarStage: "adult", position: 2, currentStreak: 14 },
    { userId: "u004", pairName: "Carla & GUTO",    xp: 9100,  avatarStage: "adult", position: 3, currentStreak: 6  },
    { userId: "u003", pairName: "Bruno & GUTO",    xp: 7800,  avatarStage: "adult", position: 4, currentStreak: 0  },
    { userId: "u006", pairName: "Fernanda & GUTO", xp: 5600,  avatarStage: "adult", position: 5, currentStreak: 9  },
  ],
}

// Status reais (active | paused | archived) — espelham GutoTeam do backend.
// Distribuição: 4 ativas, 1 pausada, 1 arquivada — pra exercitar todos os tons.
export const MOCK_EMPRESAS: Empresa[] = [
  { id: "emp001", name: "Studio Vértice",   responsible: "Carolina Souza", email: "caro@vertice.fit",          country: "BR", plan: "pro",    status: "active",   maxStudents: 60,  maxCoaches: 5,  usage: { students: 42, coaches: 3 }, lastActivityAt: "2026-05-09T09:00:00Z", createdAt: "2025-09-12" },
  { id: "emp002", name: "Forge Athletic",   responsible: "Diego Marques",  email: "diego@forge.com.br",        country: "BR", plan: "start",  status: "active",   maxStudents: 25,  maxCoaches: 2,  usage: { students: 18, coaches: 2 }, lastActivityAt: "2026-05-08T16:30:00Z", createdAt: "2025-11-04" },
  { id: "emp003", name: "Casa Hipertrofia", responsible: "Marina Prado",   email: "marina@casahipertrofia.it", country: "IT", plan: "custom", status: "active",   maxStudents: 120, maxCoaches: 10, usage: { students: 88, coaches: 7 }, lastActivityAt: "2026-05-09T07:14:00Z", createdAt: "2025-06-22" },
  { id: "emp004", name: "Pulse Coletivo",   responsible: "Lia Bertoni",    email: "lia@pulse.coach",           country: "PT", plan: "start",  status: "active",   maxStudents: 15,  maxCoaches: 1,  usage: { students: 6,  coaches: 1 }, lastActivityAt: "2026-05-09T10:55:00Z", createdAt: "2026-04-18" },
  { id: "emp005", name: "Núcleo Sul",       responsible: "Pedro Ávila",    email: "pedro@nucleosul.fit",       country: "BR", plan: "pro",    status: "paused",   maxStudents: 40,  maxCoaches: 3,  usage: { students: 0,  coaches: 2 }, lastActivityAt: "2026-04-11T18:20:00Z", createdAt: "2025-08-01" },
  { id: "emp006", name: "Ferro Negro",      responsible: "Iara Coelho",    email: "iara@ferronegro.it",        country: "IT", plan: "pro",    status: "archived", maxStudents: 50,  maxCoaches: 4,  usage: { students: 31, coaches: 3 }, lastActivityAt: "2026-05-02T22:10:00Z", createdAt: "2025-07-15" },
]

export const MOCK_EX_PENDING: ExercisePending[] = [
  { id: "ex001", name: "Remada cavalinho unilateral",  muscle: "Costas",  equipment: "Barra T",       location: "academia", durationSec: 11, sizeMb: 7.4,  filename: "remada-cavalinho-unilateral.mp4", submittedBy: "c001", submittedAt: "2026-05-09T08:12:00Z", status: "pendente" },
  { id: "ex002", name: "Agachamento búlgaro com halter", muscle: "Pernas", equipment: "Halter",       location: "academia", durationSec: 14, sizeMb: 9.1,  filename: "agachamento-bulgaro.mp4",        submittedBy: "c003", submittedAt: "2026-05-09T07:40:00Z", status: "pendente" },
  { id: "ex003", name: "Flexão diamante",                muscle: "Tríceps", equipment: "Peso corporal", location: "casa",    durationSec: 9,  sizeMb: 5.8,  filename: "flexao-diamante.mp4",            submittedBy: "c002", submittedAt: "2026-05-08T19:02:00Z", status: "pendente" },
  { id: "ex004", name: "Sprint em escada",               muscle: "Cardio", equipment: "Nenhum",        location: "ar-livre", durationSec: 13, sizeMb: 10.2, filename: "sprint-escada.mp4",              submittedBy: "c001", submittedAt: "2026-05-08T11:21:00Z", status: "pendente" },
  { id: "ex005", name: "Crucifixo invertido na polia",   muscle: "Ombros", equipment: "Polia baixa",   location: "academia", durationSec: 12, sizeMb: 8.0,  filename: "crucifixo-invertido-polia.mp4",  submittedBy: "c002", submittedAt: "2026-05-07T17:45:00Z", status: "pendente" },
]

export const MOCK_FOOD_PENDING: FoodPending[] = [
  { id: "fd001", pt: "Pão de queijo",            it: "Pane al formaggio brasiliano",  en: "Brazilian cheese bread",  es: "Pan de queso",            country: "BR", category: "Lanche",       macros: { kcal: 280, p: 6, c: 32, f: 14 }, allergens: ["leite", "ovo", "glúten"], restrictions: ["vegetariano"],         submittedBy: "c001", status: "pendente" },
  { id: "fd002", pt: "Tapioca com queijo",       it: "Tapioca con formaggio",         en: "Tapioca with cheese",     es: "Tapioca con queso",       country: "BR", category: "Café da manhã", macros: { kcal: 240, p: 9, c: 30, f: 9 },  allergens: ["leite"],                    restrictions: ["sem glúten"],          submittedBy: "c003", status: "pendente" },
  { id: "fd003", pt: "Bresaola com rúcula",      it: "Bresaola con rucola",           en: "Bresaola with arugula",   es: "Bresaola con rúcula",     country: "IT", category: "Pré-treino",    macros: { kcal: 180, p: 28, c: 3, f: 6 },  allergens: [],                            restrictions: ["sem lactose", "sem glúten"], submittedBy: "c002", status: "pendente" },
  { id: "fd004", pt: "Açaí natural sem açúcar",  it: "Açaí naturale senza zucchero",  en: "Unsweetened açaí",        es: "Açaí natural sin azúcar", country: "BR", category: "Pós-treino",    macros: { kcal: 160, p: 2, c: 18, f: 9 },  allergens: [],                            restrictions: ["vegano", "sem glúten"], submittedBy: "c001", status: "pendente" },
]

export const SYS_TELEMETRY: SysTelemetry = {
  build: "v0.42.7",
  region: "sa-east-1",
  uptimePct: 99.97,
  pendingTotal: MOCK_EX_PENDING.length + MOCK_FOOD_PENDING.length,
}
