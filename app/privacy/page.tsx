import Link from "next/link"

export const metadata = {
  title: "Política de Privacidade — GUTO",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-white px-6 py-10">
      <div className="mx-auto max-w-prose">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[rgba(13,35,65,0.35)]">GUTO</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[rgba(13,35,65,0.9)]">Política de Privacidade</h1>
        <p className="mt-1 text-xs text-[rgba(13,35,65,0.4)]">Versão beta — maio 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[rgba(13,35,65,0.75)]">
          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              1. Controlador dos dados
            </h2>
            <p>
              Os dados coletados pelo GUTO são controlados por Willian Gustavo dos Santos.
              Contato: dj@toszan.com.br
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              2. Quais dados são coletados
            </h2>
            <p>O GUTO coleta e processa os seguintes dados fornecidos por você:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Nome de exibição</li>
              <li>Idioma de preferência</li>
              <li>Dados físicos: peso, altura, idade, sexo</li>
              <li>Objetivo de treino (ex: perda de gordura, ganho muscular)</li>
              <li>Local de treino preferido (academia, casa, parque)</li>
              <li>Limitações físicas e patologias informadas</li>
              <li>Restrições e intolerâncias alimentares</li>
              <li>Histórico de treino e progresso (XP, dias treinados)</li>
              <li>Interações com o assistente GUTO via chat</li>
              <li>Telefone (opcional)</li>
              <li>País de residência (opcional)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              3. Para que os dados são usados
            </h2>
            <p>
              Os dados são usados exclusivamente para personalizar treinos, dietas, rotinas e
              acompanhamento dentro do GUTO. Nenhum dado é vendido ou compartilhado com terceiros para
              fins comerciais.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              4. Onde os dados são armazenados
            </h2>
            <p>
              Os dados são armazenados em servidores seguros (Supabase / Vercel) e, localmente, no
              dispositivo do usuário via localStorage do navegador. O armazenamento segue as práticas
              padrão do setor de proteção de dados.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              5. Base legal
            </h2>
            <p>
              O tratamento dos seus dados é baseado no seu consentimento explícito, fornecido ao aceitar
              estes termos antes de usar o GUTO. Dados de saúde (peso, altura, patologias, etc.) são
              tratados sob consentimento explícito conforme exigido pelo LGPD e GDPR.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              6. Seus direitos
            </h2>
            <p>Você tem direito a:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Acessar os dados que o GUTO armazena sobre você</li>
              <li>Solicitar correção de dados incorretos</li>
              <li>Solicitar exclusão dos seus dados</li>
            </ul>
            <p className="mt-2">
              Para exercer esses direitos, entre em contato pelo e-mail: dj@toszan.com.br
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              7. Período beta
            </h2>
            <p>
              O GUTO está em versão beta privada. Esta política pode ser atualizada durante esse período.
              Mudanças significativas serão comunicadas diretamente no app.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
              8. Contato
            </h2>
            <p>
              Para qualquer dúvida sobre privacidade ou tratamento de dados: dj@toszan.com.br
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
