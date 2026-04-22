export type SupportedLanguage = "pt-BR" | "it-IT" | "es-ES" | "en-US"

export type EvolutionStage = "BABY" | "TEEN" | "ADULT" | "ELIT"

export interface GutoHistoryItem {
  role: "user" | "model"
  parts: { text: string }[]
}

export interface SendGutoMessageRequest {
  profile: { 
    name: string
    evolution?: EvolutionStage
  }
  input: string
  language: SupportedLanguage
  history: GutoHistoryItem[]
}

export interface SendGutoMessageResponse {
  fala?: string
  acao?: "none" | "updateWorkout" | "lock" | "evolve"
  newEvolution?: EvolutionStage
}