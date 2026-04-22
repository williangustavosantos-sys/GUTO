export type GutoEffectEvent =
  | "portal_open"
  | "language_select"
  | "seal_complete"
  | "pact_hold_tick"
  | "whiteout"

export interface GutoEffectPayload {
  value?: number
  meta?: Record<string, string | number | boolean>
}

export interface GutoEffectRegistry {
  emit: (event: GutoEffectEvent, payload?: GutoEffectPayload) => void
}

export function createGutoEffectRegistry(
  listener?: (event: GutoEffectEvent, payload?: GutoEffectPayload) => void
): GutoEffectRegistry {
  return {
    emit(event, payload) {
      listener?.(event, payload)
    },
  }
}
