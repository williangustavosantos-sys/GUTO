import { LegacyPanelRedirect } from "@/components/legacy-panel-redirect"

// O Portal da Empresa (/empresa) era um protótipo com dados mock. O painel
// operacional real é /coach. Mantemos a rota apenas como redirect.
export default function EmpresaPage() {
  return <LegacyPanelRedirect />
}
