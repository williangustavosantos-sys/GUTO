import Link from "next/link"

export const metadata = {
  title: "Termos de Uso — GUTO",
}

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-white px-6 py-10">
      <div className="mx-auto max-w-prose">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[rgba(13,35,65,0.35)]">GUTO</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[rgba(13,35,65,0.9)]">Termos de Uso</h1>
        <p className="mt-1 text-xs text-[rgba(13,35,65,0.4)]">Versão beta — maio 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[rgba(13,35,65,0.75)]">
          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              1. O que é o GUTO
            </h2>
            <p>
              O GUTO é um assistente digital com inteligência artificial desenvolvido para apoiar treino,
              alimentação e rotina de evolução física. Ele é operado por Willian Gustavo dos Santos
              (contato: dj@toszan.com.br).
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              2. GUTO não é um profissional de saúde
            </h2>
            <p>
              O GUTO não substitui médico, nutricionista, personal trainer ou qualquer profissional de saúde
              presencial. Tudo que o GUTO sugere — treinos, dietas, rotinas — é de natureza educacional e
              informativa, não constituindo prescrição médica ou nutricional.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              3. Responsabilidade do usuário
            </h2>
            <p>
              Você é responsável por respeitar seus limites físicos. Se sentir dor, tontura, mal-estar ou
              tiver qualquer condição médica preexistente, interrompa o treino imediatamente e procure um
              profissional de saúde. Não ignore sinais do seu corpo.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              4. Versão beta
            </h2>
            <p>
              O GUTO está em fase de beta privado. Isso significa que o sistema pode ter erros, instabilidades
              ou mudanças sem aviso prévio. Não garanta dependência crítica às informações geradas pelo GUTO
              neste período.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              5. Uso responsável
            </h2>
            <p>
              Você concorda em usar o GUTO apenas para fins pessoais e legais. É proibido compartilhar
              acesso com terceiros sem autorização, tentar extrair ou reverter engenharia do sistema, ou
              usá-lo para fins que prejudiquem outros.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              6. Dados pessoais
            </h2>
            <p>
              O tratamento dos seus dados é descrito na{" "}
              <Link href="/privacy" className="font-semibold underline text-[rgba(13,35,65,0.9)]">
                Política de Privacidade
              </Link>
              . Ao usar o GUTO, você concorda com esse tratamento.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              7. Alterações nestes termos
            </h2>
            <p>
              Estes termos podem ser atualizados durante o período beta. Mudanças significativas serão
              comunicadas diretamente no app. O uso continuado do GUTO após a notificação implica aceitação.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              8. Contato
            </h2>
            <p>
              Para dúvidas sobre estes termos, entre em contato: dj@toszan.com.br
            </p>
          </section>
        </div>

        <div className="mt-10 border-t border-[rgba(13,35,65,0.06)] pt-6">
          <Link
            href="/"
            className="font-mono text-[10px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.4)] underline"
          >
            Voltar ao GUTO
          </Link>
        </div>
      </div>
    </div>
  )
}
