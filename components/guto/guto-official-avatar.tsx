"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import type { EvolutionStage } from "@/types/contract"

export type GutoAvatarEmotion = "default" | "alert" | "critical" | "reward"

interface GutoOfficialAvatarProps {
  size?: "sm" | "md" | "lg" | "xl"
  showPlatform?: boolean
  evolution?: EvolutionStage
  emotion?: GutoAvatarEmotion
  className?: string
}

type AvatarVideoSources = {
  alphaApple?: string
  alphaType?: "hvc1" | "quicktime"
  alphaWebm?: string
  preferCanvas?: boolean
  apple?: string
  fallback: string
}

const EVOLUTION_VIDEOS: Record<EvolutionStage, Record<GutoAvatarEmotion, AvatarVideoSources>> = {
  BABY: {
    default: { alphaApple: "GUTO_BABY_2_ALPHA.mov", alphaType: "hvc1", apple: "GUTO_BABY_2_APPLE.mov", fallback: "GUTO BABY 2.webm" },
    alert: { alphaApple: "GUTO_AMARELO_BABY_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_AMARELO_BABY_ALPHA.webm", apple: "GUTO_AMARELO_BABY_ios_safe.mov", fallback: "GUTO_AMARELO_BABY.webm" },
    critical: { alphaApple: "GUTO_VERMELHO_BABY_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_VERMELHO_BABY_ALPHA.webm", apple: "GUTO_VERMELHO_BABY_ios_safe.mov", fallback: "GUTO_VERMELHO_BABY.webm" },
    reward: { alphaApple: "GUTO_ROXO_BABY_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_ROXO_BABY_ALPHA.webm", apple: "GUTO_ROXO_BABY_ios_safe.mov", fallback: "GUTO_ROXO_BABY.webm" },
  },
  TEEN: {
    default: { alphaApple: "GUTO_TEEN_2_ALPHA.mov", alphaType: "hvc1", apple: "GUTO_TEEN_2_APPLE.mov", fallback: "GUTO TEEN 2.webm" },
    alert: { alphaApple: "GUTO_AMARELO_TEEN_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_AMARELO_TEEN_ALPHA.webm", apple: "GUTO_AMARELO_TEEN_ios_safe.mov", fallback: "GUTO_AMARELO_TEEN.webm" },
    critical: { alphaApple: "GUTO_VERMELHO_TEEN_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_VERMELHO_TEEN_ALPHA.webm", apple: "GUTO_VERMELHO_TEEN_ios_safe.mov", fallback: "GUTO_VERMELHO_TEEN.webm" },
    reward: { alphaApple: "GUTO_ROXO_TEEN_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_ROXO_TEEN_ALPHA.webm", apple: "GUTO_ROXO_TEEN_ios_safe.mov", fallback: "GUTO_ROXO_TEEN.webm" },
  },
  ADULT: {
    default: { alphaApple: "GUTO_ADULT_2_ALPHA.mov", alphaType: "hvc1", apple: "GUTO_ADULT_2_APPLE.mov", fallback: "GUTO ADULT 2.webm" },
    alert: { alphaApple: "GUTO_AMARELO_ADULT_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_AMARELO_ADULT_ALPHA.webm", apple: "GUTO_AMARELO_ADULT_ios_safe.mov", fallback: "GUTO_AMARELO_ADULT.webm" },
    critical: { alphaApple: "GUTO_VERMELHO_ADULT_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_VERMELHO_ADULT_ALPHA.webm", apple: "GUTO_VERMELHO_ADULT_ios_safe.mov", fallback: "GUTO_VERMELHO_ADULT.webm" },
    reward: { alphaApple: "GUTO_ROXO_ADULT_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_ROXO_ADULT_ALPHA.webm", apple: "GUTO_ROXO_ADULT_ios_safe.mov", fallback: "GUTO_ROXO_ADULT.webm" },
  },
  ELIT: {
    default: { alphaApple: "GUTO_ELIT_2_ALPHA.mov", alphaType: "hvc1", apple: "GUTO_ELIT_2_APPLE.mov", fallback: "GUTO ELIT 2.webm" },
    alert: { alphaApple: "GUTO_AMARELO_ELIT_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_AMARELO_ELIT_ALPHA.webm", apple: "GUTO_AMARELO_ELIT_ios_safe.mov", fallback: "GUTO_AMARELO_ELIT.webm" },
    critical: { alphaApple: "GUTO_VERMELHO_ELIT_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_VERMELHO_ELIT_ALPHA.webm", apple: "GUTO_VERMELHO_ELIT_ios_safe.mov", fallback: "GUTO_VERMELHO_ELIT.webm" },
    reward: { alphaApple: "GUTO_ROXO_ELIT_ALPHA.mov", alphaType: "hvc1", alphaWebm: "GUTO_ROXO_ELIT_ALPHA.webm", apple: "GUTO_ROXO_ELIT_ios_safe.mov", fallback: "GUTO_ROXO_ELIT.webm" },
  },
}

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-40 h-40",
  xl: "w-[min(84vw,22.5rem)] h-[min(84vw,22.5rem)]",
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
  evolution = "BABY",
  className,
}: GutoOfficialAvatarProps) {
  const effectiveEmotion: GutoAvatarEmotion = "default"
  const sources = EVOLUTION_VIDEOS[evolution]?.[effectiveEmotion] ?? EVOLUTION_VIDEOS.BABY.default
  const assetKey = `${evolution}-${effectiveEmotion}`
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const [canUseAppleHvc1Video, setCanUseAppleHvc1Video] = useState(false)
  const [canUseAppleQuickTimeVideo, setCanUseAppleQuickTimeVideo] = useState(false)
  const [canUseWebmAlphaVideo, setCanUseWebmAlphaVideo] = useState(false)
  const [isSafari, setIsSafari] = useState(false)
  const [nativeVideoReady, setNativeVideoReady] = useState(false)
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
  }, [assetKey])

  useEffect(() => {
    if (!canUseNativeAlphaVideo) {
      setNativeVideoReady(false)
      return
    }

    const video = nativeVideoRef.current
    if (!video) return

    let cancelled = false

    const playNativeVideo = async () => {
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
        if (!cancelled) setNativeVideoReady(true)
      } catch {
        if (!cancelled) setNativeVideoReady(false)
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
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
  }, [assetKey, canUseNativeAlphaVideo])

  useEffect(() => {
    if (canUseNativeAlphaVideo && nativeVideoReady) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: !canUseNativeAlphaVideo })
    if (!ctx) return

    let cancelled = false

    const draw = () => {
      if (cancelled || !video.videoWidth || !video.videoHeight) return

      const cssWidth = Math.round(canvas.clientWidth || 360)
      const cssHeight = Math.round(canvas.clientHeight || 360)
      const pixelRatio = Math.min(window.devicePixelRatio || 1, canUseNativeAlphaVideo ? 2 : 1.5)
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
    document.addEventListener("visibilitychange", handleReady)
    handleReady()

    return () => {
      cancelled = true
      video.removeEventListener("loadeddata", handleReady)
      video.removeEventListener("canplay", handleReady)
      video.removeEventListener("pause", handleReady)
      document.removeEventListener("visibilitychange", handleReady)
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [assetKey, canUseNativeAlphaVideo, nativeVideoReady, sources.alphaApple, sources.preferCanvas])

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
            className="guto-official-avatar-video pointer-events-none absolute inset-0 h-full w-full object-contain"
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
          className="guto-official-avatar-canvas relative z-10 h-full w-full object-contain transition-opacity duration-150"
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
          {sources.apple && isSafari && (
            <source src={`/assets/guto/${sources.apple}`} type='video/quicktime; codecs="hvc1"' />
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
