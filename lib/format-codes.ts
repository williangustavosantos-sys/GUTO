export const TRAINING_GOAL_LABELS: Record<string, string> = {
  muscle_gain: "Ganho de massa",
  fat_loss: "Perda de gordura",
  endurance: "Resistência",
  flexibility: "Flexibilidade",
  general_fitness: "Condicionamento geral",
  rehabilitation: "Reabilitação",
  maintenance: "Manutenção",
  conditioning: "Condicionamento",
  mobility_health: "Saúde e mobilidade",
  consistency: "Consistência",
}

export const TRAINING_LOCATION_LABELS: Record<string, string> = {
  gym: "Academia",
  home: "Em casa",
  park: "Ao ar livre",
  mixed: "Variado",
}

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  pending_payment: "Pagamento pendente",
  cancelled: "Cancelado",
  paused: "Pausado",
  trial: "Período de teste",
  expired: "Expirado",
}

export const BIOLOGICAL_SEX_LABELS: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  other: "Outro",
}

export const TRAINING_LEVEL_LABELS: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
  returning: "Retornando",
  consistent: "Consistente",
}

export const WORKOUT_FOCUS_LABELS: Record<string, string> = {
  chest_triceps: "Peito e Tríceps",
  back_biceps: "Costas e Bíceps",
  legs_core: "Pernas e Core",
  shoulders_abs: "Ombros e Abdômen",
  full_body: "Corpo Todo",
}

export const AVATAR_STAGE_LABELS: Record<string, string> = {
  baby: "Baby",
  teen: "Teen",
  adult: "Adult",
  elite: "Elite",
}

export const TRAINING_STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  returning: "Retornando",
  beginner: "Iniciante",
  paused: "Pausado",
}

export function formatCode(
  code: string | undefined | null,
  map: Record<string, string>
): string {
  if (!code) return "—"
  return map[code] ?? code
}
