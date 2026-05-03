# Coach/Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full Coach/Admin control panel — backend API + standalone `/coach` frontend page — that lets the coach block, archive, reset and manage GUTO students without touching the student app.

**Architecture:** New `user-access-store.ts` (flat JSON store at `tmp/user-access.json`) provides per-user access state. New `coach-router.ts` (Express Router) exposes all coach API routes and mounts at `/guto/coach` in `server.ts`. Frontend is a standalone Next.js client page at `app/coach/page.tsx` that calls the coach API with `x-coach-id` header.

**Tech Stack:** TypeScript, Express (Router), Node `fs`, Next.js App Router (`"use client"`, `useSearchParams`), shadcn/ui (`Sheet`, `AlertDialog`, `Button`, `Input`, `Badge`, `Card`), Sonner toasts.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `guto-backend/src/user-access-store.ts` | **Create** | Read/write `tmp/user-access.json`; export CRUD helpers |
| `guto-backend/src/coach-router.ts` | **Create** | All `/guto/coach/*` routes + auth middleware |
| `guto-backend/server.ts` | **Modify** | Mount `coachRouter`; add block check to `/guto/chat` and `/guto/validate-workout` |
| `guto-backend/src/arena.ts` | **Modify** | Filter `getWeeklyRanking`, `getMonthlyRanking`, `getIndividualRanking` by visibility |
| `guto-app-v0/app/coach/page.tsx` | **Create** | Standalone Coach Dashboard page |

---

## Task 1: user-access-store.ts

**Files:**
- Create: `guto-backend/src/user-access-store.ts`

- [ ] **Step 1: Create the file with full implementation**

```ts
// guto-backend/src/user-access-store.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_ACCESS_STORE_PATH = path.join(__dirname, "../tmp/user-access.json");

export type UserRole = "student" | "coach" | "admin";

export interface UserAccess {
  userId: string;
  role: UserRole;
  coachId: string;
  active: boolean;
  visibleInArena: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserAccessStore {
  users: Record<string, UserAccess>;
}

const DEV_COACH_ID = process.env.DEV_COACH_ID ?? "will-coach";

function ensureStoreFile(): void {
  if (!fs.existsSync(USER_ACCESS_STORE_PATH)) {
    fs.mkdirSync(path.dirname(USER_ACCESS_STORE_PATH), { recursive: true });
    fs.writeFileSync(
      USER_ACCESS_STORE_PATH,
      JSON.stringify({ users: {} }, null, 2)
    );
  }
}

function readStore(): UserAccessStore {
  ensureStoreFile();
  try {
    return JSON.parse(
      fs.readFileSync(USER_ACCESS_STORE_PATH, "utf-8")
    ) as UserAccessStore;
  } catch {
    return { users: {} };
  }
}

function writeStore(store: UserAccessStore): void {
  ensureStoreFile();
  fs.writeFileSync(USER_ACCESS_STORE_PATH, JSON.stringify(store, null, 2));
}

export function getUserAccess(userId: string): UserAccess | undefined {
  return readStore().users[userId];
}

export function getEffectiveUserAccess(userId: string): UserAccess {
  const now = new Date().toISOString();
  return (
    getUserAccess(userId) ?? {
      userId,
      role: "student",
      coachId: DEV_COACH_ID,
      active: true,
      visibleInArena: true,
      archived: false,
      createdAt: now,
      updatedAt: now,
    }
  );
}

export function upsertUserAccess(
  userId: string,
  patch: Partial<Omit<UserAccess, "userId" | "createdAt">>
): UserAccess {
  const store = readStore();
  const now = new Date().toISOString();
  const existing = store.users[userId];
  const updated: UserAccess = {
    userId,
    role: existing?.role ?? "student",
    coachId: existing?.coachId ?? DEV_COACH_ID,
    active: existing?.active ?? true,
    visibleInArena: existing?.visibleInArena ?? true,
    archived: existing?.archived ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...patch,
  };
  store.users[userId] = updated;
  writeStore(store);
  return updated;
}

export function deleteUserAccessHard(userId: string): void {
  const store = readStore();
  delete store.users[userId];
  writeStore(store);
}

export function getAllUserAccess(): UserAccess[] {
  return Object.values(readStore().users);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd guto-backend && npx tsc --noEmit
```

Expected: no errors related to `user-access-store.ts`.

- [ ] **Step 3: Commit**

```bash
cd guto-backend && git add src/user-access-store.ts
git commit -m "feat(coach): add user-access-store — dedicated admin state per user"
```

---

## Task 2: coach-router.ts

**Files:**
- Create: `guto-backend/src/coach-router.ts`

- [ ] **Step 1: Create the file**

```ts
// guto-backend/src/coach-router.ts
import express, { Request, Response, NextFunction } from "express";
import {
  getUserAccess,
  getEffectiveUserAccess,
  upsertUserAccess,
  deleteUserAccessHard,
  getAllUserAccess,
  type UserAccess,
} from "./user-access-store.js";
import {
  getArenaProfile,
  saveArenaProfile,
  readArenaStore,
  writeArenaStore,
} from "./arena-store.js";
import { getAvatarStage } from "./arena.js";
import {
  readMemoryStoreSync,
  writeMemoryStoreSync,
} from "./memory-store.js";

export const coachRouter = express.Router();

// ─── Auth middleware ───────────────────────────────────────────────────────

coachRouter.use((req: Request, res: Response, next: NextFunction) => {
  const incoming = (req.headers["x-coach-id"] as string) || (req.query.coachId as string);
  const DEV_COACH_ID = process.env.DEV_COACH_ID ?? "will-coach";
  if (incoming !== DEV_COACH_ID) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
});

// ─── Helpers ──────────────────────────────────────────────────────────────

type StoredMemory = {
  userId?: string;
  name?: string;
  totalXp?: number;
  streak?: number;
  lastActiveAt?: string;
  validationHistory?: Array<{ createdAt?: string }>;
  xpEvents?: unknown[];
  completedWorkoutDates?: string[];
  adaptedMissionDates?: string[];
  missedMissionDates?: string[];
};

function buildStudentView(userId: string) {
  const store = readMemoryStoreSync() as Record<string, StoredMemory>;
  const memory: StoredMemory = store[userId] ?? {};
  const access = getEffectiveUserAccess(userId);
  const arena = getArenaProfile(userId);

  const lastValidation =
    arena?.lastWorkoutValidatedAt ??
    (memory.validationHistory?.length
      ? memory.validationHistory[memory.validationHistory.length - 1]?.createdAt ?? null
      : null);

  return {
    userId,
    name: memory.name || userId,
    role: access.role,
    coachId: access.coachId,
    active: access.active,
    visibleInArena: access.visibleInArena,
    archived: access.archived,
    weeklyXp: arena?.weeklyXp ?? 0,
    monthlyXp: arena?.monthlyXp ?? 0,
    totalXp: arena?.totalXp ?? memory.totalXp ?? 0,
    avatarStage: arena?.avatarStage ?? "baby",
    currentStreak: arena?.currentStreak ?? memory.streak ?? 0,
    validationsTotal: arena?.validatedWorkoutsTotal ?? (memory.validationHistory?.length ?? 0),
    lastValidationAt: lastValidation,
    lastActiveAt: memory.lastActiveAt ?? null,
    createdAt: access.createdAt,
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────

// GET /guto/coach/students
coachRouter.get("/students", (req: Request, res: Response) => {
  const includeArchived = req.query.includeArchived === "true";
  const store = readMemoryStoreSync() as Record<string, unknown>;

  // Also include users in UserAccess that may not be in memory store
  const memoryIds = new Set(Object.keys(store));
  const accessIds = new Set(getAllUserAccess().map((u) => u.userId));
  const allIds = [...new Set([...memoryIds, ...accessIds])];

  const students = allIds
    .map((userId) => buildStudentView(userId))
    .filter((s) => includeArchived || !s.archived);

  res.json({ students });
});

// GET /guto/coach/student/:userId
coachRouter.get("/student/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const store = readMemoryStoreSync() as Record<string, unknown>;
  const access = getUserAccess(userId);

  if (!store[userId] && !access) {
    res.status(404).json({ error: "student_not_found" });
    return;
  }

  res.json(buildStudentView(userId));
});

// PATCH /guto/coach/student/:userId
coachRouter.patch("/student/:userId", express.json(), (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name, role, coachId, visibleInArena, active, archived } = req.body as Partial<UserAccess & { name: string }>;

  // Update GutoMemory name if provided
  if (typeof name === "string" && name.trim()) {
    const store = readMemoryStoreSync() as Record<string, StoredMemory>;
    const memory: StoredMemory = store[userId] ?? { userId };
    memory.name = name.trim();
    // Also update arena display name
    const arena = getArenaProfile(userId);
    if (arena) {
      arena.displayName = name.trim();
      saveArenaProfile(arena);
    }
    store[userId] = memory;
    writeMemoryStoreSync(store);
  }

  const patch: Partial<Omit<UserAccess, "userId" | "createdAt">> = {};
  if (role !== undefined) patch.role = role;
  if (coachId !== undefined) patch.coachId = coachId;
  if (visibleInArena !== undefined) patch.visibleInArena = visibleInArena;
  if (active !== undefined) patch.active = active;
  if (archived !== undefined) patch.archived = archived;

  const updated = upsertUserAccess(userId, patch);
  res.json(buildStudentView(userId));
});

// PATCH /guto/coach/student/:userId/access
coachRouter.patch("/student/:userId/access", express.json(), (req: Request, res: Response) => {
  const { userId } = req.params;
  const { active } = req.body as { active?: boolean };

  if (typeof active !== "boolean") {
    res.status(400).json({ error: "active must be a boolean" });
    return;
  }

  upsertUserAccess(userId, { active });
  res.json(buildStudentView(userId));
});

// POST /guto/coach/student/:userId/reset
coachRouter.post("/student/:userId/reset", express.json(), (req: Request, res: Response) => {
  const { userId } = req.params;
  const { scope } = req.body as {
    scope?: "weekly" | "monthly" | "individual" | "validationHistory" | "all";
  };

  const validScopes = ["weekly", "monthly", "individual", "validationHistory", "all"];
  if (!scope || !validScopes.includes(scope)) {
    res.status(400).json({ error: `scope must be one of: ${validScopes.join(", ")}` });
    return;
  }

  // Arena resets
  const arena = getArenaProfile(userId);
  if (arena) {
    if (scope === "weekly" || scope === "all") {
      arena.weeklyXp = 0;
      arena.validatedWorkoutsWeek = 0;
    }
    if (scope === "monthly" || scope === "all") {
      arena.monthlyXp = 0;
      arena.validatedWorkoutsMonth = 0;
    }
    if (scope === "individual" || scope === "all") {
      arena.totalXp = 0;
      arena.validatedWorkoutsTotal = 0;
      arena.avatarStage = getAvatarStage(0);
    }
    if (scope === "all") {
      arena.currentStreak = 0;
      arena.lastWorkoutValidatedAt = null;
    }
    arena.updatedAt = new Date().toISOString();
    saveArenaProfile(arena);
  }

  // Memory resets
  if (scope === "validationHistory" || scope === "all") {
    const store = readMemoryStoreSync() as Record<string, StoredMemory>;
    const memory: StoredMemory = store[userId] ?? {};
    memory.validationHistory = [];
    if (scope === "all") {
      memory.streak = 0;
      memory.totalXp = 0;
      memory.xpEvents = [];
      memory.completedWorkoutDates = [];
      memory.adaptedMissionDates = [];
      memory.missedMissionDates = [];
    }
    store[userId] = memory;
    writeMemoryStoreSync(store);
  }

  res.json({ success: true, scope, userId });
});

// DELETE /guto/coach/student/:userId  — soft archive
coachRouter.delete("/student/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  upsertUserAccess(userId, {
    active: false,
    visibleInArena: false,
    archived: true,
  });
  res.json({ success: true, archived: true, userId });
});

// POST /guto/coach/student/:userId/hard-delete  — full removal (dev/admin only)
coachRouter.post("/student/:userId/hard-delete", (req: Request, res: Response) => {
  const adminKey = req.headers["x-admin-key"] as string;
  const expectedKey = process.env.ADMIN_KEY;

  if (!expectedKey) {
    res.status(403).json({ error: "hard_delete_not_configured", message: "ADMIN_KEY not set on server." });
    return;
  }
  if (adminKey !== expectedKey) {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  const { userId } = req.params;

  // Remove from memory store
  const store = readMemoryStoreSync() as Record<string, unknown>;
  delete store[userId];
  writeMemoryStoreSync(store);

  // Remove from arena store
  const arenaStore = readArenaStore();
  delete arenaStore.profiles[userId];
  arenaStore.events = arenaStore.events.filter((e) => e.userId !== userId);
  writeArenaStore(arenaStore);

  // Remove from user-access store
  deleteUserAccessHard(userId);

  res.status(204).send();
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd guto-backend && npx tsc --noEmit
```

Expected: no errors in `coach-router.ts`.

- [ ] **Step 3: Commit**

```bash
cd guto-backend && git add src/coach-router.ts
git commit -m "feat(coach): add coach-router with full CRUD + reset + archive routes"
```

---

## Task 3: Modify server.ts — mount router + block check

**Files:**
- Modify: `guto-backend/server.ts`

- [ ] **Step 1: Add import for coachRouter and getEffectiveUserAccess**

Find the existing import block at the top of `server.ts` (around line 1–30). Add these two lines after the existing imports from `./src/`:

```ts
import { coachRouter } from "./src/coach-router.js";
import { getEffectiveUserAccess } from "./src/user-access-store.js";
```

- [ ] **Step 2: Mount coachRouter in server.ts**

Find where other app routes are registered (look for `app.get("/guto/`, around line 3050+). Add this line **before** the first `app.get("/guto/` call:

```ts
app.use("/guto/coach", coachRouter);
```

- [ ] **Step 3: Add block check to /guto/chat**

Find the `/guto/chat` route handler in `server.ts`. It starts with something like:
```ts
app.post("/guto/chat", ...
```

Inside the handler, immediately after `userId` is extracted from the request body (look for `const userId = body.userId || DEFAULT_USER_ID;` around line 830-835), add:

```ts
const chatAccess = getEffectiveUserAccess(userId);
if (!chatAccess.active || chatAccess.archived) {
  return res.status(403).json({
    error: "access_blocked",
    message: "Seu acesso ao GUTO está pausado. Fale com seu coach para reativar.",
  });
}
```

- [ ] **Step 4: Add block check to /guto/validate-workout**

Find the `/guto/validate-workout` route handler. After `const { userId, ... } = body;` and the existing validation checks (around line 3454-3458), add:

```ts
const validationAccess = getEffectiveUserAccess(userId);
if (!validationAccess.active || validationAccess.archived) {
  return res.status(403).json({
    error: "access_blocked",
    message: "Seu acesso ao GUTO está pausado. Fale com seu coach para reativar.",
  });
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd guto-backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Smoke test the coach route**

Start the backend:
```bash
cd guto-backend && npm run dev
```

In another terminal:
```bash
curl http://localhost:3001/guto/coach/students \
  -H "x-coach-id: will-coach"
```

Expected: `{"students":[...]}` (empty array or existing users).

```bash
curl http://localhost:3001/guto/coach/students
```

Expected: `{"error":"unauthorized"}` with HTTP 401.

- [ ] **Step 7: Commit**

```bash
cd guto-backend && git add server.ts
git commit -m "feat(coach): mount coachRouter and add access block check in chat/validate"
```

---

## Task 4: Filter Arena rankings by visibility

**Files:**
- Modify: `guto-backend/src/arena.ts`

- [ ] **Step 1: Add import and visibility helper at top of arena.ts**

After the existing imports at the top of `src/arena.ts`, add:

```ts
import { getEffectiveUserAccess } from "./user-access-store.js";

function isVisibleInRanking(userId: string): boolean {
  const access = getEffectiveUserAccess(userId);
  return (
    access.active &&
    access.visibleInArena &&
    !access.archived &&
    access.role === "student"
  );
}
```

- [ ] **Step 2: Filter in getWeeklyRanking**

In `getWeeklyRanking`, change:
```ts
const profiles = getProfilesByGroup(arenaGroupId);
```
to:
```ts
const profiles = getProfilesByGroup(arenaGroupId).filter((p) => isVisibleInRanking(p.userId));
```

- [ ] **Step 3: Filter in getMonthlyRanking**

Same change — in `getMonthlyRanking`:
```ts
const profiles = getProfilesByGroup(arenaGroupId).filter((p) => isVisibleInRanking(p.userId));
```

- [ ] **Step 4: Filter in getIndividualRanking**

Same change — in `getIndividualRanking`:
```ts
const profiles = getProfilesByGroup(arenaGroupId).filter((p) => isVisibleInRanking(p.userId));
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd guto-backend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd guto-backend && git add src/arena.ts
git commit -m "feat(coach): filter arena rankings by visibility and access state"
```

---

## Task 5: Frontend /coach page

**Files:**
- Create: `guto-app-v0/app/coach/page.tsx`

- [ ] **Step 1: Create the full coach page**

```tsx
// guto-app-v0/app/coach/page.tsx
"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL, ApiError } from "@/lib/api/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────

type AvatarStage = "baby" | "teen" | "adult" | "elite";

interface Student {
  userId: string;
  name: string;
  role: "student" | "coach" | "admin";
  coachId: string;
  active: boolean;
  visibleInArena: boolean;
  archived: boolean;
  weeklyXp: number;
  monthlyXp: number;
  totalXp: number;
  avatarStage: AvatarStage;
  currentStreak: number;
  validationsTotal: number;
  lastValidationAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

type FilterTab = "ativos" | "pausados" | "arquivados" | "todos";
type ResetScope = "weekly" | "monthly" | "individual" | "validationHistory" | "all";

// ─── Helpers ──────────────────────────────────────────────────────────────

function getStatusLabel(s: Student): { text: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (s.archived) return { text: "ARQUIVADO", variant: "destructive" };
  if (!s.active) return { text: "PAUSADO", variant: "secondary" };
  if (!s.visibleInArena) return { text: "OCULTO ARENA", variant: "outline" };
  return { text: "ATIVO", variant: "default" };
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "há 1 dia";
  return `há ${days} dias`;
}

function avatarStageLabel(stage: AvatarStage): string {
  return { baby: "Baby", teen: "Teen", adult: "Adult", elite: "Elite" }[stage] ?? stage;
}

// ─── API helper ───────────────────────────────────────────────────────────

async function coachFetch<T>(
  path: string,
  coachId: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-coach-id": coachId,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Erro (${res.status})`;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {}
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Confirmation Dialog ──────────────────────────────────────────────────

interface ConfirmAction {
  label: string;
  onConfirm: () => Promise<void>;
}

// ─── Main inner component (needs useSearchParams inside Suspense) ─────────

function CoachInner() {
  const searchParams = useSearchParams();
  const coachId = searchParams.get("coachId") ?? "";

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("ativos");
  const [selected, setSelected] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [acting, setActing] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!coachId) { setAccessDenied(true); setLoading(false); return; }
    try {
      const data = await coachFetch<{ students: Student[] }>(
        "/guto/coach/students?includeArchived=true",
        coachId
      );
      setStudents(data.students);
      setLoading(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAccessDenied(true);
      }
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Re-sync selected student after actions
  const refreshSelected = useCallback(
    (updated: Student) => {
      setStudents((prev) => prev.map((s) => (s.userId === updated.userId ? updated : s)));
      setSelected(updated);
    },
    []
  );

  const act = useCallback(
    async (fn: () => Promise<void>, successMsg: string) => {
      setActing(true);
      try {
        await fn();
        toast.success(successMsg);
        await fetchStudents();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Erro ao executar ação.");
      } finally {
        setActing(false);
      }
    },
    [fetchStudents]
  );

  const doConfirm = (label: string, onConfirm: () => Promise<void>) => {
    setConfirm({ label, onConfirm });
  };

  // ─── Filtered list ──────────────────────────────────────────────────────

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.userId.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "todos"
        ? true
        : filter === "ativos"
        ? s.active && !s.archived
        : filter === "pausados"
        ? !s.active && !s.archived
        : s.archived;
    return matchSearch && matchFilter;
  });

  // ─── Guard screens ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <p className="text-[#00e5ff] text-sm tracking-widest uppercase animate-pulse">
          Carregando…
        </p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-3 px-6">
        <p className="text-white text-xl font-bold tracking-tight">Acesso negado</p>
        <p className="text-slate-400 text-sm text-center">
          Você não tem permissão para acessar o painel Coach.
        </p>
      </div>
    );
  }

  // ─── Main dashboard ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <Toaster theme="dark" position="bottom-center" />

      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-[#00e5ff] font-bold tracking-widest text-sm uppercase">GUTO</span>
          <span className="text-white/40 mx-2">·</span>
          <span className="text-white font-semibold text-sm">Coach Dashboard</span>
        </div>
        <span className="text-white/30 text-xs font-mono">{coachId}</span>
      </header>

      {/* Filters */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-3">
        <Input
          placeholder="Buscar aluno…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {(["ativos", "pausados", "arquivados", "todos"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors ${
                filter === tab
                  ? "bg-[#00e5ff] text-[#0a0f1e] border-[#00e5ff]"
                  : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Student count */}
      <p className="px-4 py-1 text-white/30 text-xs">
        {filtered.length} aluno{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Student list */}
      <div className="px-4 pb-20 flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="text-white/30 text-sm text-center py-8">Nenhum aluno encontrado.</p>
        )}
        {filtered.map((s) => {
          const status = getStatusLabel(s);
          return (
            <div
              key={s.userId}
              onClick={() => { setSelected(s); setEditName(s.name); }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-[#00e5ff]/30 transition-colors"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-white truncate">{s.name}</span>
                  <Badge variant={status.variant} className="text-[10px] px-2 py-0 h-5">
                    {status.text}
                  </Badge>
                </div>
                <span className="text-white/30 text-[11px] font-mono">{s.userId}</span>
                <div className="flex gap-3 mt-1">
                  <span className="text-[#00e5ff] text-xs font-mono">{s.weeklyXp}xp sem.</span>
                  <span className="text-white/40 text-xs font-mono">{s.monthlyXp}xp mês</span>
                  <span className="text-white/30 text-xs">{relativeTime(s.lastActiveAt)}</span>
                </div>
              </div>
              <span className="text-white/30 text-lg ml-3">›</span>
            </div>
          );
        })}
      </div>

      {/* Student Drawer */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="right"
          className="bg-[#0d1426] border-l border-white/10 text-white w-full max-w-sm overflow-y-auto"
        >
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-white text-base font-bold">
                  {selected.name}
                </SheetTitle>
                <p className="text-white/30 text-xs font-mono">{selected.userId}</p>
              </SheetHeader>

              {/* DADOS */}
              <Section title="Dados">
                <DataRow label="Role" value={selected.role} />
                <DataRow label="Coach ID" value={selected.coachId} />
                <DataRow
                  label="Status"
                  value={
                    <Badge variant={getStatusLabel(selected).variant} className="text-[10px]">
                      {getStatusLabel(selected).text}
                    </Badge>
                  }
                />
                <DataRow
                  label="Arena"
                  value={selected.visibleInArena ? "Visível" : "Oculto"}
                />
              </Section>

              {/* PERFORMANCE */}
              <Section title="Performance">
                <DataRow label="XP semanal" value={`${selected.weeklyXp} xp`} />
                <DataRow label="XP mensal" value={`${selected.monthlyXp} xp`} />
                <DataRow label="XP total" value={`${selected.totalXp} xp`} />
                <DataRow label="Streak" value={`${selected.currentStreak} dias`} />
                <DataRow label="Validações" value={String(selected.validationsTotal)} />
                <DataRow label="Última valid." value={relativeTime(selected.lastValidationAt)} />
                <DataRow label="Avatar" value={avatarStageLabel(selected.avatarStage)} />
              </Section>

              {/* AÇÕES RÁPIDAS */}
              <Section title="Ações rápidas">
                {/* Edit name */}
                {editingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-white/5 border-white/20 text-white text-sm h-8"
                    />
                    <Button
                      size="sm"
                      disabled={acting}
                      onClick={() =>
                        act(async () => {
                          const updated = await coachFetch<Student>(
                            `/guto/coach/student/${selected.userId}`,
                            coachId,
                            { method: "PATCH", body: JSON.stringify({ name: editName }) }
                          );
                          refreshSelected(updated);
                          setEditingName(false);
                        }, "Nome atualizado.")
                      }
                    >
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-white/70 border-white/20 hover:border-white/50"
                    onClick={() => setEditingName(true)}
                  >
                    Editar nome
                  </Button>
                )}

                {/* Block / Reactivate */}
                {selected.active ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await coachFetch<Student>(
                          `/guto/coach/student/${selected.userId}/access`,
                          coachId,
                          { method: "PATCH", body: JSON.stringify({ active: false }) }
                        );
                        refreshSelected(updated);
                      }, "Aluno bloqueado. Ele não aparecerá na Arena e não poderá continuar usando o GUTO.")
                    }
                  >
                    Bloquear acesso
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await coachFetch<Student>(
                          `/guto/coach/student/${selected.userId}/access`,
                          coachId,
                          { method: "PATCH", body: JSON.stringify({ active: true }) }
                        );
                        refreshSelected(updated);
                      }, "Acesso reativado.")
                    }
                  >
                    Reativar acesso
                  </Button>
                )}

                {/* Hide / Show arena */}
                {selected.visibleInArena ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-500/40 text-slate-300 hover:bg-slate-500/10"
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await coachFetch<Student>(
                          `/guto/coach/student/${selected.userId}`,
                          coachId,
                          { method: "PATCH", body: JSON.stringify({ visibleInArena: false }) }
                        );
                        refreshSelected(updated);
                      }, "Aluno ocultado da Arena.")
                    }
                  >
                    Ocultar da Arena
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-500/40 text-slate-300 hover:bg-slate-500/10"
                    disabled={acting}
                    onClick={() =>
                      act(async () => {
                        const updated = await coachFetch<Student>(
                          `/guto/coach/student/${selected.userId}`,
                          coachId,
                          { method: "PATCH", body: JSON.stringify({ visibleInArena: true }) }
                        );
                        refreshSelected(updated);
                      }, "Aluno visível na Arena.")
                    }
                  >
                    Mostrar na Arena
                  </Button>
                )}
              </Section>

              {/* RESETS */}
              <Section title="Resets">
                {(
                  [
                    { label: "Resetar ranking semanal", scope: "weekly" },
                    { label: "Resetar ranking mensal", scope: "monthly" },
                    { label: "Limpar histórico de validações", scope: "validationHistory" },
                  ] as { label: string; scope: ResetScope }[]
                ).map(({ label, scope }) => (
                  <Button
                    key={scope}
                    variant="outline"
                    size="sm"
                    className="w-full text-white/60 border-white/15 hover:border-white/30"
                    disabled={acting}
                    onClick={() =>
                      doConfirm(label, () =>
                        act(async () => {
                          await coachFetch(
                            `/guto/coach/student/${selected.userId}/reset`,
                            coachId,
                            { method: "POST", body: JSON.stringify({ scope }) }
                          );
                          const updated = await coachFetch<Student>(
                            `/guto/coach/student/${selected.userId}`,
                            coachId
                          );
                          refreshSelected(updated);
                        }, "Reset aplicado.")
                      )
                    }
                  >
                    {label}
                  </Button>
                ))}
              </Section>

              {/* ZONA DE RISCO */}
              <Section title="Zona de risco" danger>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled={acting}
                  onClick={() =>
                    doConfirm("Resetar progresso total", () =>
                      act(async () => {
                        await coachFetch(
                          `/guto/coach/student/${selected.userId}/reset`,
                          coachId,
                          { method: "POST", body: JSON.stringify({ scope: "all" }) }
                        );
                        const updated = await coachFetch<Student>(
                          `/guto/coach/student/${selected.userId}`,
                          coachId
                        );
                        refreshSelected(updated);
                      }, "Reset aplicado.")
                    )
                  }
                >
                  Resetar progresso total
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled={acting}
                  onClick={() =>
                    doConfirm("Arquivar aluno", () =>
                      act(async () => {
                        const updated = await coachFetch<{ userId: string }>(
                          `/guto/coach/student/${selected.userId}`,
                          coachId,
                          { method: "DELETE" }
                        );
                        await fetchStudents();
                        setSelected(null);
                      }, "Aluno arquivado.")
                    )
                  }
                >
                  Arquivar aluno
                </Button>
              </Section>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent className="bg-[#0d1426] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{confirm?.label}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Essa ação não pode ser desfeita. Confirmar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                const fn = confirm?.onConfirm;
                setConfirm(null);
                if (fn) await fn();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function Section({
  title,
  children,
  danger,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className={`mb-5 ${danger ? "opacity-80" : ""}`}>
      <p
        className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
          danger ? "text-red-400/70" : "text-white/30"
        }`}
      >
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-white/5">
      <span className="text-white/40 text-xs">{label}</span>
      <span className="text-white text-xs font-medium">{value}</span>
    </div>
  );
}

// ─── Page export (Suspense wraps useSearchParams) ─────────────────────────

export default function CoachPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
          <p className="text-[#00e5ff] text-sm tracking-widest uppercase animate-pulse">
            Carregando…
          </p>
        </div>
      }
    >
      <CoachInner />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd guto-app-v0 && npx tsc --noEmit
```

Expected: no errors in `app/coach/page.tsx`.

- [ ] **Step 3: Start frontend and verify page loads**

```bash
cd guto-app-v0 && npm run dev
```

Open: `http://localhost:3000/coach?coachId=will-coach`

Expected: Coach Dashboard loads with student list (or empty state if no users).

Open: `http://localhost:3000/coach`

Expected: "Acesso negado" screen (no coachId provided → API returns 401).

- [ ] **Step 4: Commit**

```bash
cd guto-app-v0 && git add app/coach/page.tsx
git commit -m "feat(coach): add standalone /coach dashboard page"
```

---

## Task 6: Final TypeScript verification + integration commit

**Files:** All modified files

- [ ] **Step 1: Full TypeScript check — backend**

```bash
cd guto-backend && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Full TypeScript check — frontend**

```bash
cd guto-app-v0 && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Run backend tests to ensure no regressions**

```bash
cd guto-backend && npm test
```

Expected: all existing tests pass.

- [ ] **Step 4: Manual end-to-end test**

With backend running on port 3001:

```bash
# List students
curl http://localhost:3001/guto/coach/students -H "x-coach-id: will-coach"

# Block a user (replace USER_ID with a real userId from the list above)
curl -X PATCH http://localhost:3001/guto/coach/student/USER_ID/access \
  -H "x-coach-id: will-coach" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'

# Verify block in chat
curl -X POST http://localhost:3001/guto/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "message": "oi"}'
# Expected: {"error":"access_blocked","message":"Seu acesso ao GUTO está pausado..."}

# Reactivate
curl -X PATCH http://localhost:3001/guto/coach/student/USER_ID/access \
  -H "x-coach-id: will-coach" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'

# Reset weekly
curl -X POST http://localhost:3001/guto/coach/student/USER_ID/reset \
  -H "x-coach-id: will-coach" \
  -H "Content-Type: application/json" \
  -d '{"scope": "weekly"}'

# Archive (soft delete)
curl -X DELETE http://localhost:3001/guto/coach/student/USER_ID \
  -H "x-coach-id: will-coach"
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: Coach/Admin panel — full backend + frontend implementation"
```

---

## Self-review checklist

- [x] `user-access-store.ts` exports `getUserAccess`, `getEffectiveUserAccess`, `upsertUserAccess`, `deleteUserAccessHard`, `getAllUserAccess`
- [x] `coach-router.ts` implements all 7 routes from spec
- [x] Auth guard uses `process.env.DEV_COACH_ID ?? "will-coach"`
- [x] Hard-delete requires `x-admin-key` + `process.env.ADMIN_KEY`
- [x] Block check in `/guto/chat` and `/guto/validate-workout` returns 403 with correct message
- [x] DELETE is soft archive (active=false, visibleInArena=false, archived=true)
- [x] Arena rankings filter by isVisibleInRanking (role+active+visible+archived)
- [x] Frontend reads `coachId` from query param, sends as `x-coach-id` header
- [x] Access denied screen on missing coachId or 401 response
- [x] All dangerous actions gated by `AlertDialog` confirmation
- [x] All toast messages match spec exactly
- [x] No new npm dependencies added
- [x] `useSearchParams` wrapped in `Suspense` (Next.js App Router requirement)
- [x] `app/coach/page.tsx` does not import `BottomNavigation` or `EliteHudExperience`
- [x] ESM imports use `.js` extensions in backend files
