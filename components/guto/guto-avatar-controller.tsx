"use client"

/**
 * GutoAvatarController — Avatar interativo com 3D spring tilt + toggle super
 *
 * ARQUITETURA:
 * - GutoOfficialAvatar sempre roda embaixo (qualidade 100% preservada: alpha channel, canvas matte, HEVC)
 * - Vídeo super em overlay com crossfade suave — toggle manual (tap entra, tap sai)
 * - Framer Motion spring tilt no toque/drag e giroscópio no mobile
 * - Squish + glow azul + ripple em ambos os taps
 *
 * Three.js NÃO é usado aqui intencionalmente:
 * O avatar é um render 3D profissional. Qualquer recriação em WebGL seria um downgrade.
 * O efeito 3D vem de CSS perspective + spring physics — dá sensação de profundidade e massa
 * sem sacrificar nada da qualidade do render original.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { animate, motion, useMotionValue, useSpring } from "framer-motion"

import { cn } from "@/lib/utils"
import type { EvolutionStage } from "@/types/contract"
import { GutoOfficialAvatar } from "./guto-official-avatar"

interface GutoAvatarControllerProps {
  stage: EvolutionStage
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showPlatform?: boolean
  onTap?: () => void
}

// Duração do crossfade entrada/saída (ms)
const FADE_MS = 320
// Duração do glow/ripple de feedback (ms)
const REACT_MS = 850
// Máximo de inclinação 3D em graus (toque manual)
const MAX_TILT_DEG = 16
// Máximo de inclinação 3D em graus (giroscópio — mais sutil)
const MAX_GYRO_DEG = 6

const SPRING_CONFIG = { stiffness: 200, damping: 26, mass: 0.7 }

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-40 h-40",
  xl: "w-[min(96vw,34rem)] h-[min(96vw,34rem)]",
}

export function GutoAvatarController({
  stage,
  size = "lg",
  className,
  showPlatform = true,
  onTap,
}: GutoAvatarControllerProps) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const glowTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)

  // Toggle: true = modo super (roupa) ativo
  const [superOn, setSuperOn]       = useState(false)
  // Lazy mount: só renderiza o super após o primeiro tap (economia de CPU na abertura)
  // Permanece montado para que os taps seguintes sejam instantâneos
  const [superMounted, setSuperMounted] = useState(false)
  // Glow/ripple de feedback visual (dispara em ambos os taps)
  const [glowActive, setGlowActive] = useState(false)
  const [gyroActive, setGyroActive] = useState(false)

  // ── Motion values para tilt 3D ──────────────────────────────────────────────
  const rawX  = useMotionValue(0)
  const rawY  = useMotionValue(0)
  const scaleV = useMotionValue(1)
  const tiltX = useSpring(rawX, SPRING_CONFIG)
  const tiltY = useSpring(rawY, SPRING_CONFIG)

  // ── Giroscópio (DeviceOrientation) ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("DeviceOrientationEvent" in window)) return

    let active = true

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (!active) return
      const gamma = Math.max(-45, Math.min(45, e.gamma ?? 0))
      const beta  = Math.max(-45, Math.min(45, (e.beta ?? 30) - 30))
      rawY.set((gamma / 45) * MAX_GYRO_DEG)
      rawX.set(-(beta  / 45) * MAX_GYRO_DEG)
    }

    window.addEventListener("deviceorientation", onOrientation, { passive: true })
    setGyroActive(true)

    return () => {
      active = false
      window.removeEventListener("deviceorientation", onOrientation)
    }
  }, [rawX, rawY])

  // ── Tilt por pointer (mouse/touch drag) ─────────────────────────────────────
  const updateTiltFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const relX = ((clientX - rect.left) / rect.width  - 0.5) * 2
      const relY = ((clientY - rect.top)  / rect.height - 0.5) * 2
      rawY.set(relX *  MAX_TILT_DEG)
      rawX.set(relY * -MAX_TILT_DEG)
    },
    [rawX, rawY]
  )

  const resetTilt = useCallback(() => {
    if (!gyroActive) {
      rawX.set(0)
      rawY.set(0)
    }
  }, [gyroActive, rawX, rawY])

  // ── Toggle super ─────────────────────────────────────────────────────────────
  // Tap 1 → super entra com crossfade natural
  // Tap 2 → super sai com crossfade natural
  // Squish + glow + ripple disparam nos dois taps
  const triggerToggle = useCallback(() => {
    onTap?.()

    // Squish spring em ambos os sentidos
    void animate(scaleV, [1, 0.91, 1.07, 1.0], {
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1],
    })

    // Glow / ripple de feedback — sempre
    setGlowActive(true)
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current)
    glowTimerRef.current = setTimeout(() => setGlowActive(false), REACT_MS)

    setSuperOn(prev => {
      const next = !prev
      if (next) {
        // Entrando em modo super: garante que o overlay está montado
        setSuperMounted(true)
      }
      return next
    })
  }, [onTap, scaleV])

  // ── Handlers de pointer ──────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => { updateTiltFromPointer(e.clientX, e.clientY) },
    [updateTiltFromPointer]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const down = pointerDownRef.current
      if (down) {
        const dx = Math.abs(e.clientX - down.x)
        const dy = Math.abs(e.clientY - down.y)
        // Só considera tap se o dedo não se moveu mais de 8px (evita disparar no scroll)
        if (dx < 8 && dy < 8) triggerToggle()
      }
      pointerDownRef.current = null
      resetTilt()
    },
    [triggerToggle, resetTilt]
  )

  const handlePointerLeave = useCallback(() => {
    pointerDownRef.current = null
    resetTilt()
  }, [resetTilt])

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex select-none flex-col items-center justify-center",
        className
      )}
      style={{ perspective: "900px" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {/* ── Bloco 3D: tilt + squish ─────────────────────────────────────────── */}
      <motion.div
        style={{
          rotateX: tiltX,
          rotateY: tiltY,
          scale: scaleV,
          transformStyle: "preserve-3d",
          cursor: "pointer",
        }}
      >
        <div className={cn("relative", sizeClasses[size])}>

          {/* Camada 1 — Avatar idle (normal branco/azul, qualidade máxima) */}
          <GutoOfficialAvatar
            size={size}
            evolution={stage}
            emotion="default"
            showPlatform={false}
            className="pointer-events-none h-full w-full"
          />

          {/* Camada 2 — GUTO de roupa (super) com crossfade natural
              Lazy mount: só renderiza após o primeiro tap.
              Permanece montado — taps seguintes são instantâneos.
              O crossfade é feito apenas com opacity + CSS transition,
              sem remount → sem flash, parece que o avatar "muda de roupa". */}
          {superMounted && (
            <div
              className="pointer-events-none absolute inset-0 z-20"
              style={{
                opacity: superOn ? 1 : 0,
                transition: `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            >
              <GutoOfficialAvatar
                size={size}
                evolution={stage}
                emotion="super"
                showPlatform={false}
                className="pointer-events-none h-full w-full"
              />
            </div>
          )}

          {/* Camada 3 — Glow azul no tap (entra e sai) */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-30 rounded-full"
            animate={
              glowActive
                ? { opacity: [0, 0.8, 0], scale: [0.85, 1.25, 1.55] }
                : { opacity: 0, scale: 1 }
            }
            transition={{ duration: 0.72, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(circle, rgba(82,231,255,0.55) 0%, rgba(82,231,255,0.2) 40%, transparent 68%)",
              boxShadow:
                "0 0 50px rgba(82,231,255,0.55), 0 0 90px rgba(82,231,255,0.25)",
            }}
          />
        </div>

        {/* Anel de ripple — dispara em tap de entrada E de saída */}
        {glowActive && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-30 rounded-full"
            initial={{ scale: 0.85, opacity: 0.65 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            style={{ border: "2px solid rgba(82,231,255,0.55)" }}
          />
        )}
      </motion.div>

      {/* ── Plataforma ────────────────────────────────────────────────────────── */}
      {showPlatform && (
        <div className="relative mt-[-0.5rem] flex w-full max-w-[10.5rem] items-center justify-center">
          <div className="absolute h-10 w-[72%] rounded-full bg-[radial-gradient(circle,rgba(82,231,255,0.12)_0%,rgba(82,231,255,0)_76%)] blur-xl" />
          <div className="relative h-5 w-[76%] rounded-full border border-white/82 bg-white/78 shadow-[inset_0_3px_10px_rgba(122,136,154,0.12),inset_0_-6px_10px_rgba(255,255,255,0.94)]">
            <div className="absolute inset-x-[14%] top-[20%] h-[58%] rounded-full border border-white/76 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(220,230,240,0.82)_100%)]" />
            <div className="absolute inset-x-[32%] top-[38%] h-[22%] rounded-full bg-[linear-gradient(90deg,transparent,rgba(82,231,255,0.74),transparent)]" />
          </div>
        </div>
      )}
    </div>
  )
}
