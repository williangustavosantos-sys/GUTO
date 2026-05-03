# Coach/Admin Panel — Design Spec
**Date:** 2026-05-03
**Status:** Approved

---

## Overview

Implement full operational control for the Coach/Admin over students in the GUTO app. The coach needs to block, archive, reset, and manage students independently — without depending on the student to take any action.

Two deliverables:
1. **Backend** — new `user-access-store.ts`, new `coach-router.ts`, block check injected into existing routes
2. **Frontend** — standalone `/coach` page (Next.js route), no relation to the student app layout

---

## Backend

### New file: `src/user-access-store.ts`

Dedicated store for user administrative state. Stored at `tmp/user-access.json`.

**Shape:**
```ts
interface UserAccess {
  userId: string;
  role: "student" | "coach" | "admin";
  coachId: string;
  active: boolean;         // false = blocked
  visibleInArena: boolean; // false = hidden from rankings
  archived: boolean;       // true = soft-deleted
  createdAt: string;
  updatedAt: string;
}

interface UserAccessStore {
  users: Record<string, UserAccess>;
}
```

**Exported functions:**
- `getUserAccess(userId): UserAccess | undefined`
- `upsertUserAccess(userId, patch: Partial<UserAccess>): UserAccess`
- `deleteUserAccessHard(userId): void` — only used by hard-delete route
- `getAllUserAccess(): UserAccess[]`

File path: `tmp/user-access.json`. Created automatically if missing (`{ users: {} }`).

---

### New file: `src/coach-router.ts`

Mounted in `server.ts` as:
```ts
app.use("/guto/coach", coachRouter);
```

#### Auth guard

Every request to `/guto/coach/*` is validated by a middleware:

```ts
const coachId = req.headers["x-coach-id"] || req.query.coachId;
const DEV_COACH_ID = process.env.DEV_COACH_ID ?? "will-coach";
if (coachId !== DEV_COACH_ID) {
  return res.status(401).json({ error: "unauthorized" });
}
```

In the future this becomes a JWT check without changing the route structure.

#### Routes

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/guto/coach/students` | List all students with merged data from UserAccess + ArenaProfile + GutoMemory |
| `GET` | `/guto/coach/student/:userId` | Full detail for one student |
| `PATCH` | `/guto/coach/student/:userId` | Update: `name`, `role`, `coachId`, `visibleInArena`, `active` |
| `PATCH` | `/guto/coach/student/:userId/access` | Toggle active: `{ active: true | false }` |
| `POST` | `/guto/coach/student/:userId/reset` | Reset by scope (see below) |
| `DELETE` | `/guto/coach/student/:userId` | Soft archive (safe default) |
| `POST` | `/guto/coach/student/:userId/hard-delete` | Full data removal — dev/admin only |

#### GET /guto/coach/students — response shape

```json
{
  "students": [
    {
      "userId": "joao-123",
      "name": "João Silva",
      "role": "student",
      "coachId": "will-coach",
      "active": true,
      "visibleInArena": true,
      "archived": false,
      "weeklyXp": 300,
      "monthlyXp": 1200,
      "totalXp": 4500,
      "avatarStage": "teen",
      "currentStreak": 7,
      "validationsTotal": 12,
      "lastValidationAt": "2026-05-01T10:00:00Z",
      "lastActiveAt": "2026-05-02T18:00:00Z",
      "createdAt": "2026-01-10T00:00:00Z"
    }
  ]
}
```

#### POST /guto/coach/student/:userId/reset — scopes

| `scope` value | What gets reset |
|---------------|-----------------|
| `weekly` | `ArenaProfile.weeklyXp`, `validatedWorkoutsWeek` → 0 |
| `monthly` | `ArenaProfile.monthlyXp`, `validatedWorkoutsMonth` → 0 |
| `individual` | `ArenaProfile.totalXp`, `validatedWorkoutsTotal` → 0, `avatarStage` recalculated → "baby" |
| `validationHistory` | `GutoMemory.validationHistory` → `[]` |
| `all` | All of the above + `GutoMemory.streak`, `totalXp`, `xpEvents`, `completedWorkoutDates`, `adaptedMissionDates`, `missedMissionDates`, `ArenaProfile.currentStreak`, `lastWorkoutValidatedAt` → null |

#### DELETE /guto/coach/student/:userId — soft archive

Applies to `UserAccess`:
```json
{
  "active": false,
  "visibleInArena": false,
  "archived": true,
  "updatedAt": "<now>"
}
```

Does **not** delete GutoMemory or ArenaProfile data.

#### POST /guto/coach/student/:userId/hard-delete

Removes the user entirely from:
- `UserAccess` store
- `GutoMemory` (memory store)
- `ArenaProfile` (arena store)

Requires `x-coach-id` AND `x-admin-key` header matching `process.env.ADMIN_KEY`. Returns `204 No Content`.

---

### Block check in `server.ts`

Injected at the top of `/guto/chat` and `/guto/validate-workout`, immediately after `userId` is extracted:

```ts
const access = getUserAccess(userId);
if (access && access.active === false) {
  return res.status(403).json({
    error: "access_blocked",
    message: "Seu acesso ao GUTO está pausado. Fale com seu coach para reativar."
  });
}
```

Coach/admin users (`role !== "student"`) are never shown in Arena rankings — `getProfilesByGroup` and all ranking functions filter out profiles where `getUserAccess(userId)?.role !== "student"` OR `visibleInArena === false`.

---

## Frontend

### Route: `app/coach/page.tsx`

Standalone Next.js page. Does **not** use the student app layout, `BottomNavigation`, or `EliteHudExperience`.

Access: `/coach?coachId=will-coach`

The `coachId` query param is read on mount and stored in component state. Every API call sends `x-coach-id: <coachId>` header. If `coachId` is missing, the API returns 401, or the fetch fails — the page renders a friendly "Acesso negado" screen with no technical error details.

---

### Visual

- Dark background matching GUTO brand (`#0a0f1e` navy, `#00e5ff` cyan accents)
- Clean dashboard layout — no heavy animations
- Premium typography, clear hierarchy
- Responsive (mobile-first since coach may use phone)

---

### Page layout

```
┌──────────────────────────────────────────────────┐
│  GUTO · Coach Dashboard              [will-coach] │
├──────────────────────────────────────────────────┤
│  [Buscar aluno...]  [Ativos][Pausados][Arquivados][Todos] │
├──────────────────────────────────────────────────┤
│  NOME       │ STATUS   │ ARENA │ SEMANA │ MÊS │ ÚLT. ATIVIDADE │  │
│  João Silva │ ATIVO    │ 1200  │ 300xp  │ 900 │ há 2 dias      │▸ │
│  Ana Lima   │ PAUSADO  │ —     │ —      │ —   │ há 5 dias      │▸ │
└──────────────────────────────────────────────────┘
```

---

### Status badges

| Value | Badge text | Color |
|-------|------------|-------|
| `active: true, archived: false, visibleInArena: true` | ATIVO | green |
| `active: false, archived: false` | PAUSADO | amber |
| `active: true, visibleInArena: false` | OCULTO ARENA | slate |
| `archived: true` | ARQUIVADO | red/muted |

---

### Student drawer (Sheet)

Opens on row click (`▸`). Side sheet, right-aligned.

**Section: Dados**
- Nome, userId, role, coachId, status badge, visibilidade na Arena

**Section: Performance**
- XP semanal, XP mensal, XP total individual
- Streak, validações totais, última validação
- Avatar/nível atual (avatarStage)

**Section: Ações rápidas**
- Editar nome (inline input + save)
- Bloquear / Reativar acesso (toggle button)
- Ocultar / Mostrar na Arena (toggle button)

**Section: Resets**
- Resetar ranking semanal
- Resetar ranking mensal
- Limpar histórico de validações

**Section: Zona de risco** (visually separated, dimmed)
- Resetar progresso total
- Arquivar aluno

All reset and archive actions open `AlertDialog`:
> "Essa ação não pode ser desfeita. Confirmar?"

---

### Toast messages

| Action | Message |
|--------|---------|
| Bloquear | "Aluno bloqueado. Ele não aparecerá na Arena e não poderá continuar usando o GUTO." |
| Reativar | "Acesso reativado." |
| Ocultar Arena | "Aluno ocultado da Arena." |
| Mostrar Arena | "Aluno visível na Arena." |
| Arquivar | "Aluno arquivado." |
| Qualquer reset | "Reset aplicado." |
| Erro de API | Toast vermelho com `error.message` do backend |

---

### Components used (no new dependencies)

`Sheet`, `AlertDialog`, `Button`, `Input`, `Badge`, `Card`, `Toaster` — all already present in `components/ui/`.

---

## Files to create / modify

### Create
- `guto-backend/src/user-access-store.ts`
- `guto-backend/src/coach-router.ts`
- `guto-app-v0/app/coach/page.tsx`

### Modify
- `guto-backend/server.ts` — mount `coachRouter`, add block check to `/guto/chat` and `/guto/validate-workout`, filter Arena rankings by `visibleInArena`
- `guto-backend/src/arena.ts` — `getProfilesByGroup` filters hidden/archived users from rankings
- `guto-backend/src/arena-store.ts` — no change needed

---

## Security rules

- All `/guto/coach/*` routes require valid `x-coach-id`
- Hard-delete additionally requires `x-admin-key`
- A student (`role: "student"`) can never call coach routes — the auth guard checks the incoming coach ID, not the target user's role
- In production: replace `DEV_COACH_ID` check with JWT validation, no structural change needed

---

## Out of scope (for now)

- Multi-coach support (multiple coachIds managing different student groups)
- Audit log of coach actions
- Email/push notification to student on block
- Hard-delete from the frontend UI
