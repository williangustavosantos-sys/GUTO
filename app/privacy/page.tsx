import Link from "next/link"

type Lang = "pt-BR" | "en-US" | "it-IT"

type Section =
  | { heading: string; body: string }
  | { heading: string; intro?: string; list: string[]; outro?: string }

const VALID_LANGS: Lang[] = ["pt-BR", "en-US", "it-IT"]

const privacyCopy: Record<Lang, {
  title: string
  heading: string
  version: string
  back: string
  sections: Section[]
}> = {
  "pt-BR": {
    title: "Política de Privacidade — GUTO",
    heading: "Política de Privacidade",
    version: "Versão beta — maio 2026",
    back: "Voltar ao GUTO",
    sections: [
      { heading: "1. Controlador dos dados", body: "Os dados coletados pelo GUTO são controlados por Willian Gustavo dos Santos. Contato: dj@toszan.com.br" },
      {
        heading: "2. Quais dados são coletados",
        intro: "O GUTO coleta e processa os seguintes dados fornecidos por você:",
        list: [
          "Nome de exibição",
          "Idioma de preferência",
          "Dados físicos: peso, altura, idade, sexo",
          "Objetivo de treino (ex: perda de gordura, ganho muscular)",
          "Local de treino preferido (academia, casa, parque)",
          "Limitações físicas e patologias informadas",
          "Restrições e intolerâncias alimentares",
          "Histórico de treino e progresso (XP, dias treinados)",
          "Interações com o assistente GUTO via chat",
          "Telefone (opcional)",
          "País de residência (opcional)",
        ],
      },
      { heading: "3. Para que os dados são usados", body: "Os dados são usados exclusivamente para personalizar treinos, dietas, rotinas e acompanhamento dentro do GUTO. Nenhum dado é vendido ou compartilhado com terceiros para fins comerciais." },
      { heading: "4. Onde os dados são armazenados", body: "Os dados são armazenados em servidores seguros (Supabase / Vercel) e, localmente, no dispositivo do usuário via localStorage do navegador. O armazenamento segue as práticas padrão do setor de proteção de dados." },
      { heading: "5. Base legal", body: "O tratamento dos seus dados é baseado no seu consentimento explícito, fornecido ao aceitar estes termos antes de usar o GUTO. Dados de saúde (peso, altura, patologias, etc.) são tratados sob consentimento explícito conforme exigido pelo LGPD e GDPR." },
      {
        heading: "6. Seus direitos",
        intro: "Você tem direito a:",
        list: [
          "Acessar os dados que o GUTO armazena sobre você",
          "Solicitar correção de dados incorretos",
          "Solicitar exclusão dos seus dados",
        ],
        outro: "Para exercer esses direitos, entre em contato pelo e-mail: dj@toszan.com.br",
      },
      { heading: "7. Período beta", body: "O GUTO está em versão beta privada. Esta política pode ser atualizada durante esse período. Mudanças significativas serão comunicadas diretamente no app." },
      { heading: "8. Contato", body: "Para qualquer dúvida sobre privacidade ou tratamento de dados: dj@toszan.com.br" },
    ],
  },
  "en-US": {
    title: "Privacy Policy — GUTO",
    heading: "Privacy Policy",
    version: "Beta version — May 2026",
    back: "Back to GUTO",
    sections: [
      { heading: "1. Data controller", body: "Data collected by GUTO is controlled by Willian Gustavo dos Santos. Contact: dj@toszan.com.br" },
      {
        heading: "2. What data is collected",
        intro: "GUTO collects and processes the following data provided by you:",
        list: [
          "Display name",
          "Language preference",
          "Physical data: weight, height, age, sex",
          "Training goal (e.g., fat loss, muscle gain)",
          "Preferred training location (gym, home, park)",
          "Physical limitations and disclosed pathologies",
          "Dietary restrictions and intolerances",
          "Training history and progress (XP, training days)",
          "Interactions with the GUTO assistant via chat",
          "Phone number (optional)",
          "Country of residence (optional)",
        ],
      },
      { heading: "3. How the data is used", body: "The data is used exclusively to personalize workouts, diets, routines, and tracking within GUTO. No data is sold or shared with third parties for commercial purposes." },
      { heading: "4. Where data is stored", body: "Data is stored on secure servers (Supabase / Vercel) and, locally, on the user's device via browser localStorage. Storage follows industry-standard data protection practices." },
      { heading: "5. Legal basis", body: "The processing of your data is based on your explicit consent, provided when accepting these terms before using GUTO. Health data (weight, height, pathologies, etc.) is processed under explicit consent as required by LGPD and GDPR." },
      {
        heading: "6. Your rights",
        intro: "You have the right to:",
        list: [
          "Access the data GUTO stores about you",
          "Request correction of incorrect data",
          "Request deletion of your data",
        ],
        outro: "To exercise these rights, contact: dj@toszan.com.br",
      },
      { heading: "7. Beta period", body: "GUTO is in private beta. This policy may be updated during this period. Significant changes will be communicated directly in the app." },
      { heading: "8. Contact", body: "For any questions about privacy or data processing: dj@toszan.com.br" },
    ],
  },
  "it-IT": {
    title: "Informativa sulla Privacy — GUTO",
    heading: "Informativa sulla Privacy",
    version: "Versione beta — maggio 2026",
    back: "Torna a GUTO",
    sections: [
      { heading: "1. Titolare del trattamento", body: "I dati raccolti da GUTO sono controllati da Willian Gustavo dos Santos. Contatto: dj@toszan.com.br" },
      {
        heading: "2. Quali dati vengono raccolti",
        intro: "GUTO raccoglie e tratta i seguenti dati forniti da te:",
        list: [
          "Nome visualizzato",
          "Preferenza linguistica",
          "Dati fisici: peso, altezza, età, sesso",
          "Obiettivo di allenamento (es. perdita di grasso, aumento muscolare)",
          "Luogo di allenamento preferito (palestra, casa, parco)",
          "Limitazioni fisiche e patologie dichiarate",
          "Restrizioni e intolleranze alimentari",
          "Storico degli allenamenti e progressi (XP, giorni di allenamento)",
          "Interazioni con l'assistente GUTO tramite chat",
          "Numero di telefono (opzionale)",
          "Paese di residenza (opzionale)",
        ],
      },
      { heading: "3. A cosa servono i dati", body: "I dati sono utilizzati esclusivamente per personalizzare allenamenti, diete, routine e monitoraggio all'interno di GUTO. Nessun dato viene venduto o condiviso con terzi per scopi commerciali." },
      { heading: "4. Dove vengono archiviati i dati", body: "I dati sono archiviati su server sicuri (Supabase / Vercel) e, localmente, sul dispositivo dell'utente tramite localStorage del browser. L'archiviazione segue le pratiche standard del settore per la protezione dei dati." },
      { heading: "5. Base giuridica", body: "Il trattamento dei tuoi dati si basa sul tuo consenso esplicito, fornito accettando questi termini prima di utilizzare GUTO. I dati sanitari (peso, altezza, patologie, ecc.) sono trattati sotto consenso esplicito come richiesto dal LGPD e dal GDPR." },
      {
        heading: "6. I tuoi diritti",
        intro: "Hai il diritto di:",
        list: [
          "Accedere ai dati che GUTO archivia su di te",
          "Richiedere la correzione di dati errati",
          "Richiedere la cancellazione dei tuoi dati",
        ],
        outro: "Per esercitare questi diritti, contatta: dj@toszan.com.br",
      },
      { heading: "7. Periodo beta", body: "GUTO è in versione beta privata. Questa politica potrebbe essere aggiornata durante questo periodo. Le modifiche significative saranno comunicate direttamente nell'app." },
      { heading: "8. Contatto", body: "Per qualsiasi domanda sulla privacy o sul trattamento dei dati: dj@toszan.com.br" },
    ],
  },
}

type Props = { searchParams: Promise<{ lang?: string }> }

export async function generateMetadata({ searchParams }: Props) {
  const { lang } = await searchParams
  const resolved: Lang = VALID_LANGS.includes(lang as Lang) ? (lang as Lang) : "pt-BR"
  return { title: privacyCopy[resolved].title }
}

export default async function PrivacyPage({ searchParams }: Props) {
  const { lang } = await searchParams
  const resolved: Lang = VALID_LANGS.includes(lang as Lang) ? (lang as Lang) : "pt-BR"
  const t = privacyCopy[resolved]

  return (
    <div className="min-h-dvh bg-white px-6 py-10">
      <div className="mx-auto max-w-prose">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[rgba(13,35,65,0.35)]">GUTO</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[rgba(13,35,65,0.9)]">{t.heading}</h1>
        <p className="mt-1 text-xs text-[rgba(13,35,65,0.4)]">{t.version}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[rgba(13,35,65,0.75)]">
          {t.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-[rgba(13,35,65,0.55)]">
                {section.heading}
              </h2>
              {"list" in section ? (
                <>
                  {section.intro && <p>{section.intro}</p>}
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {section.outro && <p className="mt-2">{section.outro}</p>}
                </>
              ) : (
                <p>{section.body}</p>
              )}
            </section>
          ))}
        </div>

        <div className="mt-10 border-t border-[rgba(13,35,65,0.06)] pt-6">
          <Link
            href="/"
            className="font-mono text-[10px] font-black uppercase tracking-widest text-[rgba(13,35,65,0.4)] underline"
          >
            {t.back}
          </Link>
        </div>
      </div>
    </div>
  )
}
