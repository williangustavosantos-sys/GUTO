import { LegacyPanelRedirect } from "@/components/legacy-panel-redirect"

// A Sala de Controle (/admin) era um protótipo com dados mock. O painel
// operacional real é /coach. Mantemos a rota apenas como redirect.
// (O login real continua em /admin/login, rota própria, não afetada.)
export default function AdminPage() {
  return <LegacyPanelRedirect />
}
