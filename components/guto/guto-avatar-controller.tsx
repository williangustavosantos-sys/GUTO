"use client"

/**
 * GutoAvatarController — Avatar interativo com 3D GLB + spring tilt + toggle super
 *
 * ARQUITETURA:
 * - Guto3DAvatar renderiza o modelo GLB em Three.js com fundo 100% transparente
 * - Modo super: troca o modelo GLB via isSuperMode → crossfade pelo próprio loader
 * - Tilt: callbacks passados ao 3D scene → lidos em useFrame, zero re-renders React
 * - Squish: scaleV MotionValue → getSquish callback lida em useFrame
 * - Giroscópio no mobile (DeviceOrientation API)
 * - Glow azul + ripple de feedback em tap
 * - Haptic via Web Vibration API (Android Chrome)
 * - Dynamic import com ssr:false — Three.js é browser-only
 */

import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"
import { animate, motion, useMotionValue, useSpring } from "framer-motion"

import { cn } from "@/lib/utils"
import type { EvolutionStage } from "@/types/contract"

// Three.js só funciona no browser — carregamento lazy com ssr:false
const Guto3DAvatar = dynamic(
  () => import("./guto-3d-avatar").then((m) => ({ default: m.Guto3DAvatar })),
  { ssr: false, loading: () => null }
)

interface GutoAvatarControllerProps {
  stage: EvolutionStage
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showPlatform?: boolean
  onTap?: () => void
}

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

  // Toggle: true = modo super ativo
  const [superOn, setSuperOn]     = useState(false)
  // Feedback visual (glow + ripple)
  const [glowActive, setGlowActive] = useState(false)
  const [gyroActive, setGyroActive] = useState(false)

  // ── Motion values para tilt ─────────────────────────────────────────────────
  const rawX   = useMotionValue(0)
  const rawY   = useMotionValue(0)
  const scaleV = useMotionValue(1)
  const tiltX  = useSpring(rawX, SPRING_CONFIG)
  const tiltY  = useSpring(rawY, SPRING_CONFIG)

  // ── Callbacks para o GutoScene ler em useFrame (zero re-renders) ────────────
  const getTilt = useCallback(
    () => ({ x: tiltX.get(), y: tiltY.get() }),
    [tiltX, tiltY]
  )
  const getSquish = useCallback(() => scaleV.get(), [scaleV])

  // ── Giroscópio (DeviceOrientation) ─────────────────────────────────────────
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

  // ── Tilt por pointer ────────────────────────────────────────────────────────
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

  // ── Toggle super ────────────────────────────────────────────────────────────
  const triggerToggle = useCallback(() => {
    onTap?.()

    // Haptic feedback (Android Chrome)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(superOn ? [30, 20, 30] : 45)
    }

    // Squish spring — anima scaleV que o getSquish callback repassa ao Three.js
    void animate(scaleV, [1, 0.91, 1.07, 1.0], {
      duration: 0.42,
      ease: [0.22, 1, 0.36, 1],
    })

    // Glow / ripple
    setGlowActive(true)
    if (glowTimerRef.current) clearTimeout(glowTimerRef.current)
    glowTimerRef.current = setTimeout(() => setGlowActive(false), REACT_MS)

    setSuperOn(prev => !prev)
  }, [onTap, scaleV, superOn])

  // ── Handlers de pointer ─────────────────────────────────────────────────────
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {/* ── Avatar 3D ──────────────────────────────────────────────────────── */}
      {/* Nota: o tilt e squish são delegados ao useFrame do Three.js via
          callbacks — sem perspective CSS aqui, a profundidade vem do 3D real */}
      <div
        className={cn("relative cursor-pointer", sizeClasses[size])}
        style={{ touchAction: "none" }}
      >
        {/* Modelo 3D — muda GLB quando superOn troca */}
        <Guto3DAvatar
          stage={stage}
          isSuperMode={superOn}
          getTilt={getTilt}
          getSquish={getSquish}
          className="pointer-events-none absolute inset-0"
        />

        {/* Glow azul no tap */}
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

        {/* Anel de ripple */}
        {glowActive && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-30 rounded-full"
            initial={{ scale: 0.85, opacity: 0.65 }}
            animate={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            style={{ border: "2px solid rgba(82,231,255,0.55)" }}
          />
        )}
      </div>

      {/* ── Plataforma ─────────────────────────────────────────────────────── */}
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
