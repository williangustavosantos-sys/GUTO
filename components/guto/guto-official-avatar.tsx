"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import type { EvolutionStage } from "@/types/contract"

interface GutoOfficialAvatarProps {
  size?: "sm" | "md" | "lg" | "xl"
  showPlatform?: boolean
  evolution?: EvolutionStage
  className?: string
}

const EVOLUTION_VIDEOS = {
  BABY: { alphaApple: "GUTO_BABY_2_ALPHA.mov", apple: "GUTO_BABY_2_APPLE.mov", fallback: "GUTO BABY 2.webm" },
  TEEN: { alphaApple: "GUTO_TEEN_2_ALPHA.mov", apple: "GUTO_TEEN_2_APPLE.mov", fallback: "GUTO TEEN 2.webm" },
  ADULT: { alphaApple: "GUTO_ADULT_2_ALPHA.mov", apple: "GUTO_ADULT_2_APPLE.mov", fallback: "GUTO ADULT 2.webm" },
  ELIT: { alphaApple: "GUTO_ELIT_2_ALPHA.mov", apple: "GUTO_ELIT_2_APPLE.mov", fallback: "GUTO ELIT 2.webm" },
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

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index]
    const green = data[index + 1]
    const blue = data[index + 2]

    const darkestEdge = Math.max(red, green, blue)

    if (darkestEdge < 12) {
      data[index + 3] = 0
    } else if (darkestEdge < 38) {
      const fade = (darkestEdge - 12) / 26
      data[index + 3] = Math.round(data[index + 3] * Math.max(0.18, fade))
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
  const sources = EVOLUTION_VIDEOS[evolution] ?? EVOLUTION_VIDEOS.BABY
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null)
  const frameRef = useRef<number | null>(null)
  const [canUseAppleAlphaVideo, setCanUseAppleAlphaVideo] = useState(false)
  const [nativeVideoReady, setNativeVideoReady] = useState(false)

  useEffect(() => {
    const probe = document.createElement("video")
    const canPlayHevc =
      probe.canPlayType('video/quicktime; codecs="hvc1"') ||
      probe.canPlayType('video/mp4; codecs="hvc1"')
    setCanUseAppleAlphaVideo(Boolean(canPlayHevc))
  }, [])

  useEffect(() => {
    setNativeVideoReady(false)
  }, [evolution])

  useEffect(() => {
    if (!canUseAppleAlphaVideo) {
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
        video.playsInline = true
        video.setAttribute("playsinline", "")
        video.setAttribute("webkit-playsinline", "")
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
    document.addEventListener("visibilitychange", handleVisibility)
    void playNativeVideo()

    return () => {
      cancelled = true
      video.removeEventListener("loadeddata", playNativeVideo)
      video.removeEventListener("canplay", playNativeVideo)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [canUseAppleAlphaVideo, evolution])

  useEffect(() => {
    if (canUseAppleAlphaVideo && nativeVideoReady) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: !canUseAppleAlphaVideo })
    if (!ctx) return

    let cancelled = false

    const draw = () => {
      if (cancelled || !video.videoWidth || !video.videoHeight) return

      const cssWidth = Math.round(canvas.clientWidth || 360)
      const cssHeight = Math.round(canvas.clientHeight || 360)
      const pixelRatio = Math.min(window.devicePixelRatio || 1, canUseAppleAlphaVideo ? 2 : 1.5)
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
      if (!canUseAppleAlphaVideo) {
        stripVideoMatte(ctx, width, height)
      }

      frameRef.current = window.requestAnimationFrame(draw)
    }

    const playVideo = async () => {
      try {
        video.defaultMuted = true
        video.muted = true
        video.playsInline = true
        video.controls = false
        video.setAttribute("playsinline", "")
        video.setAttribute("webkit-playsinline", "")
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
    document.addEventListener("visibilitychange", handleReady)
    handleReady()

    return () => {
      cancelled = true
      video.removeEventListener("loadeddata", handleReady)
      video.removeEventListener("canplay", handleReady)
      document.removeEventListener("visibilitychange", handleReady)
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [canUseAppleAlphaVideo, evolution, nativeVideoReady])

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-transparent",
          sizeClasses[size]
        )}
      >
        {canUseAppleAlphaVideo && (
          <video
            ref={nativeVideoRef}
            key={`${evolution}-native-alpha`}
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            preload="auto"
            className={cn(
              "guto-official-avatar-video pointer-events-none absolute inset-0 z-20 h-full w-full object-contain transition-opacity duration-150",
              nativeVideoReady ? "opacity-100" : "opacity-0"
            )}
          >
            <source src={`/assets/guto/${sources.alphaApple}`} type='video/quicktime; codecs="hvc1"' />
          </video>
        )}

        <canvas
          ref={canvasRef}
          className={cn(
            "guto-official-avatar-canvas relative z-10 h-full w-full object-contain transition-opacity duration-150",
            canUseAppleAlphaVideo && nativeVideoReady ? "opacity-0" : "opacity-100"
          )}
        />

        <video
          ref={videoRef}
          key={`${evolution}-${canUseAppleAlphaVideo ? "apple-alpha" : "matte-fallback"}`}
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          preload="auto"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          style={{
            backgroundColor: "transparent",
          }}
        >
          {canUseAppleAlphaVideo && (
            <source src={`/assets/guto/${sources.alphaApple}`} type='video/quicktime; codecs="hvc1"' />
          )}
          <source src={`/assets/guto/${sources.fallback}`} type='video/webm; codecs="vp8, vorbis"' />
          <source src={`/assets/guto/${sources.apple}`} type='video/quicktime; codecs="hvc1"' />
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
