"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import type { EvolutionStage } from "@/types/contract"

export type GutoAvatarEmotion = "default" | "alert" | "critical" | "reward" | "super"

interface GutoOfficialAvatarProps {
  size?: "sm" | "md" | "lg" | "xl"
  showPlatform?: boolean
  evolution?: EvolutionStage
  emotion?: GutoAvatarEmotion
  className?: string
  onTap?: () => void
  isActive?: boolean
}

type AvatarVideoSources = {
  alphaApple?: string
  alphaType?: "hvc1" | "quicktime"
  alphaWebm?: string
  preferCanvas?: boolean
  apple?: string   // Safari: QuickTime MOV black-bg → stripVideoMatte
  mp4?: string     // Chrome/Android: MP4 black-bg → stripVideoMatte
  fallback: string // WebM fallback (last resort)
}

const avatarSources = (baseName: string): AvatarVideoSources => ({
  apple: `${baseName}_safari.mov`,
  fallback: `${baseName}.webm`,
})

const EVOLUTION_VIDEOS: Record<EvolutionStage, Record<GutoAvatarEmotion, AvatarVideoSources>> = {
  baby: {
    default: avatarSources("baby"),
    alert: avatarSources("baby"),
    critical: avatarSources("baby"),
    reward: avatarSources("baby"),
    super: avatarSources("baby_super"),
  },
  teen: {
    default: avatarSources("teen"),
    alert: avatarSources("teen"),
    critical: avatarSources("teen"),
    reward: avatarSources("teen"),
    super: avatarSources("teen_super"),
  },
  adult: {
    default: avatarSources("adult"),
    alert: avatarSources("adult"),
    critical: avatarSources("adult"),
    reward: avatarSources("adult"),
    super: avatarSources("adult_super"),
  },
  elite: {
    default: avatarSources("elit"),
    alert: avatarSources("elit"),
    critical: avatarSources("elit"),
    reward: avatarSources("elit"),
    super: avatarSources("elit_super"),
  },
}

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-40 h-40",
  xl: "w-[min(96vw,34rem)] h-[min(96vw,34rem)]",
}

function isCoarsePointerDevice() {
  if (typeof window === "undefined") return false
  return window.matchMedia?.("(pointer: coarse)")?.matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

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
  let matteRed = 0
  let matteGreen = 0
  let matteBlue = 0

  for (const [x, y] of samplePoints) {
    const clampedX = Math.max(0, Math.min(width - 1, x))
    const clampedY = Math.max(0, Math.min(height - 1, y))
    const index = (clampedY * width + clampedX) * 4
    matteRed += data[index]
    matteGreen += data[index + 1]
    matteBlue += data[index + 2]
  }

  matteRed /= samplePoints.length
  matteGreen /= samplePoints.length
  matteBlue /= samplePoints.length
  const matteBrightness = Math.max(matteRed, matteGreen, matteBlue)

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index]
    const green = data[index + 1]
    const blue = data[index + 2]
    const brightness = Math.max(red, green, blue)
    const matteDistance = Math.max(
      Math.abs(red - matteRed),
      Math.abs(green - matteGreen),
      Math.abs(blue - matteBlue)
    )

    if (
      (matteBrightness < 56 && matteDistance < 18 && brightness < 64) ||
      (matteBrightness < 86 && matteDistance < 16 && brightness < 72)
    ) {
      data[index + 3] = 0
    } else if (matteBrightness < 86 && matteDistance < 30 && brightness < 96) {
      const fade = Math.max(0, Math.min(1, (brightness - 18) / 66))
      data[index + 3] = Math.round(data[index + 3] * Math.max(0.08, fade))
    }
  }

  ctx.putImageData(image, 0, 0)
}

export function GutoOfficialAvatar({
  size = "lg",
  showPlatform = true,
  evolution = "baby",
  emotion,
  className,
  isActive = true,
}: GutoOfficialAvatarProps) {
  const effectiveEmotion: GutoAvatarEmotion = emotion ?? "default"
  const sources = EVOLUTION_VIDEOS[evolution]?.[effectiveEmotion] ?? EVOLUTION_VIDEOS.baby.default
  const assetKey = `${evolution}-${effectiveEmotion}`
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const canvasReadyRef = useRef(false)
  const [canUseAppleHvc1Video, setCanUseAppleHvc1Video] = useState(false)
  const [canUseAppleQuickTimeVideo, setCanUseAppleQuickTimeVideo] = useState(false)
  const [canUseWebmAlphaVideo, setCanUseWebmAlphaVideo] = useState(false)
  const [isSafari, setIsSafari] = useState(false)
  const [nativeVideoReady, setNativeVideoReady] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const nativeAlphaSource =
    sources.alphaApple &&
    !isSafari &&
    ((sources.alphaType === "hvc1" && canUseAppleHvc1Video) ||
      (sources.alphaType === "quicktime" && canUseAppleQuickTimeVideo))
      ? {
          src: sources.alphaApple,
          type: sources.alphaType === "quicktime" ? "video/quicktime" : 'video/quicktime; codecs="hvc1"',
        }
      : sources.alphaWebm && canUseWebmAlphaVideo && !isSafari
        ? {
            src: sources.alphaWebm,
            type: 'video/webm; codecs="vp9"',
          }
        : null
  const canUseNativeAlphaVideo =
    Boolean(nativeAlphaSource)

  useEffect(() => {
    const probe = document.createElement("video")
    const userAgent = navigator.userAgent
    const canPlayHevc =
      probe.canPlayType('video/quicktime; codecs="hvc1"') ||
      probe.canPlayType('video/mp4; codecs="hvc1"')
    const canPlayQuickTime = probe.canPlayType("video/quicktime")
    const canPlayWebmAlpha = probe.canPlayType('video/webm; codecs="vp9"')
    setIsSafari(/^((?!chrome|android|crios|fxios).)*safari/i.test(userAgent))
    setCanUseAppleHvc1Video(Boolean(canPlayHevc))
    setCanUseAppleQuickTimeVideo(Boolean(canPlayQuickTime))
    setCanUseWebmAlphaVideo(Boolean(canPlayWebmAlpha))
  }, [])

  useEffect(() => {
    setNativeVideoReady(false)
    setCanvasReady(false)
    canvasReadyRef.current = false
    if (process.env.NODE_ENV === "development") {
      console.info("[GUTO_AVATAR] loading without visual fallback:", assetKey)
    }
  }, [assetKey])

  useEffect(() => {
    if (typeof document === "undefined") return
    const warmupHref = sources.apple || sources.mp4 || sources.fallback
    if (!warmupHref) return
    const warmup = document.createElement("video")
    warmup.preload = "auto"
    warmup.muted = true
    warmup.playsInline = true
    warmup.src = warmupHref
    warmup.load()
    return () => {
      warmup.src = ""
    }
  }, [assetKey, sources.apple, sources.fallback, sources.mp4])

  useEffect(() => {
    if (!canUseNativeAlphaVideo) {
      setNativeVideoReady(false)
      return
    }

    const video = nativeVideoRef.current
    if (!video) return

    if (!isActive) {
      video.pause()
      return
    }

    let cancelled = false

    const playNativeVideo = async () => {
      if (!isActive) return
      try {
        video.defaultMuted = true
        video.muted = true
        video.controls = false
        video.autoplay = true
        video.loop = true
        video.playsInline = true
        video.disablePictureInPicture = true
        video.setAttribute("playsinline", "")
        video.setAttribute("webkit-playsinline", "")
        video.setAttribute("muted", "")
        video.setAttribute("autoplay", "")
        video.setAttribute("loop", "")
        video.removeAttribute("controls")
        await video.play()
        if (!cancelled) {
          setNativeVideoReady(true)
          if (process.env.NODE_ENV === "development") {
            console.info("[GUTO_AVATAR] real avatar ready:", assetKey)
          }
        }
      } catch {
        if (!cancelled) setNativeVideoReady(false)
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isActive) {
        void playNativeVideo()
      }
    }

    video.addEventListener("loadeddata", playNativeVideo)
    video.addEventListener("canplay", playNativeVideo)
    video.addEventListener("pause", playNativeVideo)
    document.addEventListener("visibilitychange", handleVisibility)
    void playNativeVideo()

    return () => {
      cancelled = true
      video.removeEventListener("loadeddata", playNativeVideo)
      video.removeEventListener("canplay", playNativeVideo)
      video.removeEventListener("pause", playNativeVideo)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [assetKey, canUseNativeAlphaVideo, isActive])

  useEffect(() => {
    if (canUseNativeAlphaVideo && nativeVideoReady) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    if (!isActive) {
      video.pause()
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      return
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: !canUseNativeAlphaVideo })
    if (!ctx) return

    let cancelled = false
    let lastFrameAt = 0
    const isMobile = isCoarsePointerDevice()
    const minFrameMs = isMobile ? 66 : 16

    const draw = (timestamp = 0) => {
      if (cancelled || !video.videoWidth || !video.videoHeight) return
      if (timestamp - lastFrameAt < minFrameMs) {
        frameRef.current = window.requestAnimationFrame(draw)
        return
      }
      lastFrameAt = timestamp

      if (!canvasReadyRef.current) {
        canvasReadyRef.current = true
        setCanvasReady(true)
        if (process.env.NODE_ENV === "development") {
          console.info("[GUTO_AVATAR] real avatar ready:", assetKey)
        }
      }

      const cssWidth = Math.round(canvas.clientWidth || 360)
      const cssHeight = Math.round(canvas.clientHeight || 360)
      const pixelRatio = isMobile ? Math.min(window.devicePixelRatio || 1, 1.35) : Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(cssWidth * pixelRatio))
      const height = Math.max(1, Math.round(cssHeight * pixelRatio))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      ctx.clearRect(0, 0, width, height)

      const scale = Math.min(width / video.videoWidth, height / video.videoHeight)
      const drawWidth = video.videoWidth * scale
      const drawHeight = video.videoHeight * scale
      const offsetX = (width - drawWidth) / 2
      const offsetY = (height - drawHeight) / 2

      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
      const currentSource = video.currentSrc.toLowerCase()
      const usingAlphaSource = currentSource.includes("_alpha.")
      if (!usingAlphaSource) {
        stripVideoMatte(ctx, width, height)
      }

      frameRef.current = window.requestAnimationFrame(draw)
    }

    const playVideo = async () => {
      if (!isActive) return
      try {
        video.defaultMuted = true
        video.muted = true
        video.autoplay = true
        video.loop = true
        video.playsInline = true
        video.controls = false
        video.disablePictureInPicture = true
        video.setAttribute("playsinline", "")
        video.setAttribute("webkit-playsinline", "")
        video.setAttribute("muted", "")
        video.setAttribute("autoplay", "")
        video.setAttribute("loop", "")
        video.removeAttribute("controls")
        await video.play()
        draw()
      } catch {
        draw()
      }
    }

    const handleReady = () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      playVideo()
    }

    video.addEventListener("loadeddata", handleReady)
    video.addEventListener("canplay", handleReady)
    video.addEventListener("pause", handleReady)
    const handleVisibility = () => { if (document.visibilityState === "visible" && isActive) handleReady() }
    document.addEventListener("visibilitychange", handleVisibility)
    handleReady()

    return () => {
      cancelled = true
      video.removeEventListener("loadeddata", handleReady)
      video.removeEventListener("canplay", handleReady)
      video.removeEventListener("pause", handleReady)
      document.removeEventListener("visibilitychange", handleVisibility)
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      video.pause()
    }
  }, [assetKey, canUseNativeAlphaVideo, isActive, nativeVideoReady, sources.alphaApple, sources.preferCanvas])

  if (canUseNativeAlphaVideo && nativeAlphaSource) {
    return (
      <div key={assetKey} className={cn("relative flex flex-col items-center justify-center", className)}>
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden bg-transparent",
            sizeClasses[size]
          )}
        >
          <video
            ref={nativeVideoRef}
            key={`${assetKey}-${nativeAlphaSource.src}`}
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            controls={false}
            controlsList="nodownload noplaybackrate nofullscreen"
            preload="auto"
            className={cn(
              "guto-official-avatar-video pointer-events-none absolute inset-0 z-10 h-full w-full object-contain transition-opacity duration-150",
              nativeVideoReady ? "opacity-100" : "opacity-0"
            )}
          >
            <source src={`/assets/guto/${nativeAlphaSource.src}`} type={nativeAlphaSource.type} />
          </video>
        </div>

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

  return (
    <div key={assetKey} className={cn("relative flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-transparent",
          sizeClasses[size]
        )}
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "guto-official-avatar-canvas relative z-10 h-full w-full object-contain transition-opacity duration-150",
            canvasReady ? "opacity-100" : "opacity-0"
          )}
        />

        <video
          ref={videoRef}
          key={`${assetKey}-${canUseNativeAlphaVideo ? "apple-alpha" : "matte-fallback"}`}
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          controls={false}
          controlsList="nodownload noplaybackrate nofullscreen"
          preload="auto"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          style={{
            backgroundColor: "transparent",
          }}
        >
          {/* Safari — QuickTime MOV black-bg → stripVideoMatte */}
          {sources.apple && isSafari && (
            <source src={`/assets/guto/${sources.apple}`} type="video/quicktime" />
          )}
          {/* Chrome / Android — MP4 black-bg → stripVideoMatte (VP8 alpha não funciona em canvas) */}
          {sources.mp4 && !isSafari && (
            <source src={`/assets/guto/${sources.mp4}`} type="video/mp4" />
          )}
          {sources.alphaApple && !sources.preferCanvas && !isSafari && (
            <source
              src={`/assets/guto/${sources.alphaApple}`}
              type={sources.alphaType === "quicktime" ? "video/quicktime" : 'video/quicktime; codecs="hvc1"'}
            />
          )}
          {sources.alphaWebm && <source src={`/assets/guto/${sources.alphaWebm}`} type='video/webm; codecs="vp9"' />}
          <source src={`/assets/guto/${sources.fallback}`} type="video/webm" />
          {sources.apple && !isSafari && (
            <source src={`/assets/guto/${sources.apple}`} type='video/quicktime; codecs="hvc1"' />
          )}
        </video>
      </div>

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
