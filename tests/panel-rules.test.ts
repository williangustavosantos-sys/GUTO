import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
  GUTO_CORE_TEAM_ID,
  activeClientTeams,
  clientTeams,
  coachesForTeam,
  studentRequiresCoach,
  blockCreateStudent,
  headerCtaForScreen,
  legacyPanelRedirectTarget,
} from "../lib/panel-rules"

const teams = [
  { id: GUTO_CORE_TEAM_ID, status: "active" },
  { id: "t1", status: "active" },
  { id: "t2", status: "paused" },
  { id: "t3", status: "archived" },
]

describe("panel-rules · contagem de empresas", () => {
  it("clientTeams exclui GUTO_CORE", () => {
    assert.deepEqual(clientTeams(teams).map((t) => t.id), ["t1", "t2", "t3"])
  })

  it("empresa real ATIVA não conta GUTO_CORE", () => {
    assert.equal(activeClientTeams(teams).some((t) => t.id === GUTO_CORE_TEAM_ID), false)
  })

  it("arquivada/pausada não conta como ativa (só t1)", () => {
    assert.deepEqual(activeClientTeams(teams).map((t) => t.id), ["t1"])
    assert.equal(activeClientTeams(teams).length, 1)
  })
})

describe("panel-rules · coaches filtrados por empresa", () => {
  const coaches = [
    { teamId: "t1", userId: "c1" },
    { teamId: "t1", userId: "c2" },
    { teamId: "t2", userId: "c3" },
  ]
  it("só retorna coaches da empresa pedida", () => {
    assert.deepEqual(coachesForTeam(coaches, "t1").map((c) => c.userId), ["c1", "c2"])
    assert.deepEqual(coachesForTeam(coaches, "t2").map((c) => c.userId), ["c3"])
  })
  it("sem empresa → lista vazia", () => {
    assert.deepEqual(coachesForTeam(coaches, ""), [])
    assert.deepEqual(coachesForTeam(coaches, null), [])
  })
})

describe("panel-rules · criar aluno exige vínculo empresa/coach", () => {
  const base = { name: "Aluno", email: "aluno@guto.test" }

  it("super_admin sem empresa → bloqueia em 'team'", () => {
    assert.equal(
      blockCreateStudent({ ...base, needsTeam: true, teamId: "", coachId: "", teamCoachCount: 0, requiresCoach: false }),
      "team",
    )
  })

  it("empresa cliente sem nenhum coach → 'no-coach-in-team'", () => {
    assert.equal(
      blockCreateStudent({ ...base, needsTeam: true, teamId: "t1", coachId: "", teamCoachCount: 0, requiresCoach: true }),
      "no-coach-in-team",
    )
  })

  it("empresa cliente com coaches mas nenhum escolhido → 'coach'", () => {
    assert.equal(
      blockCreateStudent({ ...base, needsTeam: true, teamId: "t1", coachId: "", teamCoachCount: 2, requiresCoach: true }),
      "coach",
    )
  })

  it("empresa cliente com coach escolhido → null (pode criar)", () => {
    assert.equal(
      blockCreateStudent({ ...base, needsTeam: true, teamId: "t1", coachId: "c1", teamCoachCount: 2, requiresCoach: true }),
      null,
    )
  })

  it("GUTO_CORE é exceção: não exige coach", () => {
    assert.equal(studentRequiresCoach(GUTO_CORE_TEAM_ID), false)
    assert.equal(
      blockCreateStudent({ ...base, needsTeam: true, teamId: GUTO_CORE_TEAM_ID, coachId: "", teamCoachCount: 0, requiresCoach: false }),
      null,
    )
  })

  it("admin (coach opcional) pode criar sem coach quando não é exigido", () => {
    assert.equal(
      blockCreateStudent({ ...base, needsTeam: false, teamId: "", coachId: "", teamCoachCount: 0, requiresCoach: false }),
      null,
    )
  })

  it("nome e email continuam obrigatórios", () => {
    assert.equal(
      blockCreateStudent({ name: "", email: "a@a.com", needsTeam: false, teamId: "t1", coachId: "c1", teamCoachCount: 1, requiresCoach: false }),
      "name",
    )
    assert.equal(
      blockCreateStudent({ name: "A", email: "", needsTeam: false, teamId: "t1", coachId: "c1", teamCoachCount: 1, requiresCoach: false }),
      "email",
    )
  })
})

describe("panel-rules · +Aluno não aparece no Dashboard", () => {
  const roles = { isSuperAdmin: true, isAdmin: true }
  it("Dashboard (hoje) não tem CTA de aluno", () => {
    assert.equal(headerCtaForScreen("hoje", roles), null)
  })
  it("Alunos tem +Aluno", () => {
    assert.equal(headerCtaForScreen("students", roles), "aluno")
  })
  it("Empresas tem +Empresa só para super_admin", () => {
    assert.equal(headerCtaForScreen("empresas", { isSuperAdmin: true, isAdmin: true }), "empresa")
    assert.equal(headerCtaForScreen("empresas", { isSuperAdmin: false, isAdmin: true }), null)
  })
})

describe("panel-rules · /admin e /empresa não levam para mock", () => {
  it("/admin e /empresa redirecionam para /coach", () => {
    assert.equal(legacyPanelRedirectTarget("/admin"), "/coach")
    assert.equal(legacyPanelRedirectTarget("/admin/teams/abc123"), "/coach")
    assert.equal(legacyPanelRedirectTarget("/empresa"), "/coach")
  })
  it("/admin/login continua sendo login real (não redireciona)", () => {
    assert.equal(legacyPanelRedirectTarget("/admin/login"), null)
  })
  it("/coach e outras rotas não redirecionam", () => {
    assert.equal(legacyPanelRedirectTarget("/coach"), null)
    assert.equal(legacyPanelRedirectTarget("/login"), null)
  })
})
