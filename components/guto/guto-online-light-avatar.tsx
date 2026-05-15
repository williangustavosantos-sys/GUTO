"use client"

/**
 * GutoOnlineLightAvatar — Luz falante do GUTO Online
 *
 * TRANSPARÊNCIA IMPECÁVEL em Safari + Chrome:
 *
 *  Chrome / Android
 *    → GUTO_ONLINE_ALPHA.webm  (VP9 yuva420p, alpha_mode=1)
 *    → Canvas lê alpha nativo do VP9 — stripVideoMatte NÃO é chamado
 *    → Transparência perfeita, zero artefato de borda
 *
 *  Safari macOS / iOS
 *    → GUTO_ONLINE_ios_safe.mov  (H.264 fundo preto)
 *    → Canvas + stripVideoMatte detecta fundo preto e remove
 *    → Resultado: luz brilhante sobre fundo transparente
 *
 * O componente reutiliza a mesma lógica de canvas do GutoOfficialAvatar
 * mas é dedicado: sem estágios, sem emoções, fonte única.
 *
 * Props:
 *   isSpeaking  — quando true, adiciona pulsação sutil de glow azul
 *   size        — padrão "xl" (igual ao original do GUTO Online)
 */

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GutoOnlineLightAvatarProps {
  isSpeaking?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-40 h-40",
  xl: "w-[min(88vw,22rem)] h-[min(88vw,22rem)]",
}

// Detecta fundo da cena e remove em runtime (para iOS/Safari)
function stripVideoMatte(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const image = ctx.getImageData(0, 0, width, height)
  const { data } = image
  const samplePoints = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
    [Math.floor(width / 2), 2],
    [Math.floor(width / 2), height - 3],
  ]
  let mR = 0, mG = 0, mB = 0
  for (const [x, y] of samplePoints) {
    const cx = Math.max(0, Math.min(width - 1, x))
    const cy = Math.max(0, Math.min(height - 1, y))
    const i  = (cy * width + cx) * 4
    mR += data[i]; mG += data[i + 1]; mB += data[i + 2]
  }
  mR /= samplePoints.length
  mG /= samplePoints.length
  mB /= samplePoints.length
  const mb = Math.max(mR, mG, mB)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const bri = Math.max(r, g, b)
    const dist = Math.max(Math.abs(r - mR), Math.abs(g - mG), Math.abs(b - mB))
    if (
      (mb < 56 && dist < 18 && bri < 64) ||
      (mb < 86 && dist < 16 && bri < 72)
    ) {
      data[i + 3] = 0
    } else if (mb < 86 && dist < 30 && bri < 96) {
      const fade = Math.max(0, Math.min(1, (bri - 18) / 66))
      data[i + 3] = Math.round(data[i + 3] * Math.max(0.08, fade))
    }
  }
  ctx.putImageData(image, 0, 0)
}

export function GutoOnlineLightAvatar({
  isSpeaking = false,
  size = "xl",
  className,
}: GutoOnlineLightAvatarProps) {
  const canvasRef       = useRef<HTMLCanvasElement | null>(null)
  const videoRef        = useRef<HTMLVideoElement | null>(null)
  const nativeVideoRef  = useRef<HTMLVideoElement | null>(null)
  const frameRef        = useRef<number | null>(null)

  const [isSafari,         setIsSafari]         = useState(false)
  const [canPlayWebmAlpha, setCanPlayWebmAlpha]  = useState(false)
  const [nativeReady,      setNativeReady]       = useState(false)
  const [canvasReady,      setCanvasReady]       = useState(false)

  // ── Detecção de capacidades (uma vez, client-side) ───────────────────────────
  useEffect(() => {
    const probe = document.createElement("video")
    const ua    = navigator.userAgent
    setIsSafari(/^((?!chrome|android|crios|fxios).)*safari/i.test(ua))
    setCanPlayWebmAlpha(Boolean(probe.canPlayType('video/webm; codecs="vp9"')))
  }, [])

  // Usa VP9 alpha webm nativo se Chrome suportar (não Safari)
  const useNativeAlpha = canPlayWebmAlpha && !isSafari

  // ── Path 1 — Native alpha: <video> VP9 webm com alpha real ──────────────────
  useEffect(() => {
    if (!useNativeAlpha) { setNativeReady(false); return }
    const video = nativeVideoRef.current
    if (!video) return
    let cancelled = false
    const play = async () => {
      try {
        video.defaultMuted = true
        video.muted        = true
        video.loop         = true
        video.playsInline  = true
        video.controls     = false
        video.disablePictureInPicture = true
        video.setAttribute("playsinline", "")
        video.setAttribute("muted", "")
        video.setAttribute("loop", "")
        video.removeAttribute("controls")
        await video.play()
        if (!cancelled) setNativeReady(true)
      } catch { if (!cancelled) setNativeReady(false) }
    }
    const onVis = () => { if (document.visibilityState === "visible") void play() }
    video.addEventListener("loadeddata", play)
    video.addEventListener("canplay",    play)
    video.addEventListener("pause",      play)
    document.addEventListener("visibilitychange", onVis)
    void play()
    return () => {
      cancelled = true
      video.removeEventListener("loadeddata", play)
      video.removeEventListener("canplay",    play)
      video.removeEventListener("pause",      play)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [useNativeAlpha])

  // ── Path 2 — Canvas matte: Safari / fallback ─────────────────────────────────
  useEffect(() => {
    if (useNativeAlpha && nativeReady) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    let cancelled = false

    const draw = () => {
      if (cancelled || !video.videoWidth || !video.videoHeight) return
      if (!canvasReady) setCanvasReady(true)

      const pr = Math.min(window.devicePixelRatio || 1, 3)
      const cw = Math.round((canvas.clientWidth  || 360) * pr)
      const ch = Math.round((canvas.clientHeight || 360) * pr)
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width  = cw
        canvas.height = ch
      }

      ctx.clearRect(0, 0, cw, ch)
      const scale  = Math.min(cw / video.videoWidth, ch / video.videoHeight)
      const dw     = video.videoWidth  * scale
      const dh     = video.videoHeight * scale
      const ox     = (cw - dw) / 2
      const oy     = (ch - dh) / 2
      ctx.drawImage(video, ox, oy, dw, dh)

      // Não chama stripVideoMatte se o arquivo já contém "_alpha" no nome
      const src = video.currentSrc?.toLowerCase() ?? ""
      if (!src.includes("_alpha")) {
        stripVideoMatte(ctx, cw, ch)
      }

      frameRef.current = window.requestAnimationFrame(draw)
    }

    const playCanvas = async () => {
      try {
        video.defaultMuted = true
        video.muted        = true
        video.loop         = true
        video.playsInline  = true
        video.controls     = false
        video.disablePictureInPicture = true
        video.setAttribute("playsinline", "")
        video.setAttribute("muted", "")
        video.setAttribute("loop", "")
        video.removeAttribute("controls")
        await video.play()
        draw()
      } catch { draw() }
    }

    const onReady = () => {
      if (frameRef.current) { window.cancelAnimationFrame(frameRef.current); frameRef.current = null }
      void playCanvas()
    }
    const onVis = () => { if (document.visibilityState === "visible") onReady() }

    video.addEventListener("loadeddata",        onReady)
    video.addEventListener("canplay",           onReady)
    video.addEventListener("pause",             onReady)
    document.addEventListener("visibilitychange", onVis)
    onReady()

    return () => {
      cancelled = true
      video.removeEventListener("loadeddata",        onReady)
      video.removeEventListener("canplay",           onReady)
      video.removeEventListener("pause",             onReady)
      document.removeEventListener("visibilitychange", onVis)
      if (frameRef.current) { window.cancelAnimationFrame(frameRef.current); frameRef.current = null }
    }
  }, [useNativeAlpha, nativeReady, canvasReady])

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>

      {/* Glow de fundo — pulsa quando isSpeaking */}
      <motion.div
        className="pointer-events-none absolute inset-[-10%] rounded-full"
        animate={
          isSpeaking
            ? {
                opacity:   [0.18, 0.42, 0.18],
                scale:     [0.92, 1.08, 0.92],
              }
            : { opacity: 0.08, scale: 1 }
        }
        transition={
          isSpeaking
            ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.6 }
        }
        style={{
          background:
            "radial-gradient(circle, rgba(82,231,255,0.55) 0%, rgba(82,231,255,0.1) 55%, transparent 75%)",
          filter: "blur(18px)",
        }}
      />

      {/* ── Path 1: native VP9 alpha <video> (Chrome) ────────────────────────── */}
      {useNativeAlpha && (
        <video
          ref={nativeVideoRef}
          autoPlay loop muted playsInline
          disablePictureInPicture
          controls={false}
          preload="auto"
          className={cn(
            "pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-200",
            nativeReady ? "opacity-100" : "opacity-0"
          )}
        >
          <source src="/assets/guto/GUTO_ONLINE_ALPHA.webm" type='video/webm; codecs="vp9"' />
        </video>
      )}

      {/* ── Path 2: canvas matte (Safari + fallback) ─────────────────────────── */}
      {!useNativeAlpha && (
        <>
          <canvas
            ref={canvasRef}
            className={cn(
              "pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-200",
              canvasReady ? "opacity-100" : "opacity-0"
            )}
          />
          <video
            ref={videoRef}
            autoPlay loop muted playsInline
            disablePictureInPicture
            controls={false}
            preload="auto"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          >
            {/* Safari: H.264 fundo preto → stripVideoMatte remove */}
            {isSafari && (
              <source src="/assets/guto/GUTO_ONLINE_ios_safe.mov" type="video/quicktime" />
            )}
            {/* Fallback: VP9 alpha webm */}
            <source src="/assets/guto/GUTO_ONLINE_ALPHA.webm" type='video/webm; codecs="vp9"' />
            {/* Último recurso: ios_safe */}
            {!isSafari && (
              <source src="/assets/guto/GUTO_ONLINE_ios_safe.mov" type="video/quicktime" />
            )}
          </video>
        </>
      )}
    </div>
  )
}
