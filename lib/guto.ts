// lib/api/guto.ts

import { apiRequest } from "./client"

export type SupportedLanguage = "pt-BR" | "it-IT" | "es-ES" | "en-US"

export interface SendGutoMessageRequest {
  profile: { name: string }
  input: string
  language: SupportedLanguage
  history: {
    role: "user" | "model"
    parts: { text: string }[]
  }[]
}

export interface SendGutoMessageResponse {
  fala?: string
}

export async function sendGutoMessage(payload: SendGutoMessageRequest) {
  return apiRequest<SendGutoMessageResponse>("/guto", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}