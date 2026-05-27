import { LegacyPanelRedirect } from "@/components/legacy-panel-redirect"

// O detalhe de empresa em /admin/teams/:id era protótipo com dados mock. O
// detalhe real abre dentro de /coach (drawer da empresa). Rota vira redirect.
export default function TeamDetailPage() {
  return <LegacyPanelRedirect />
}
