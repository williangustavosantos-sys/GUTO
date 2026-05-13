"use client"

import { useCallback, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import type { EvolutionStage } from "@/types/contract"

interface GutoAvatarControllerProps {
  stage: EvolutionStage
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showPlatform?: boolean
  onTap?: () => void
}

const TOUCH_DURATION_MS = 1200

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-40 h-40",
  xl: "w-[min(96vw,34rem)] h-[min(96vw,34rem)]",
}

const STAGE_TOUCH_VIDEOS: Record<string, { webm: string; mov: string }> = {
  baby: { webm: "guto_baby_toque.webm", mov: "guto_baby_toque.mov" },
  teen: { webm: "guto_teen_toque.webm", mov: "guto_teen_toque.mov" },
  adult: { webm: "guto_adult_toque.webm", mov: "guto_adult_toque.mov" },
  elite: { webm: "guto_elit_toque.webm", mov: "guto_elit_toque.mov" },
}

const STAGE_DEFAULT_VIDEOS: Record<string, { webm: string; mov: string }> = {
  baby: { webm: "GUTO BABY 2.webm", mov: "GUTO_BABY_2_APPLE.mov" },
  teen: { webm: "GUTO TEEN 2.webm", mov: "GUTO_TEEN_2_APPLE.mov" },
  adult: { webm: "GUTO ADULT 2.webm", mov: "GUTO_ADULT_2_APPLE.mov" },
  elite: { webm: "GUTO ELIT 2.webm", mov: "GUTO_ELIT_2_APPLE.mov" },
}

export function GutoAvatarController({
  stage,
  size = "lg",
  className,
  showPlatform = true,
  onTap,
}: GutoAvatarControllerProps) {
  const [isReacting, setIsReacting] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleTap = useCallback(() => {
    if (isReacting) return
    setIsReacting(true)
    onTap?.()

    // Restart the touch video from beginning
    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      void video.play()
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsReacting(false)
    }, TOUCH_DURATION_MS)
  }, [isReacting, onTap])

  const isTouch = isReacting
  const videos = isTouch
    ? STAGE_TOUCH_VIDEOS[stage] ?? STAGE_TOUCH_VIDEOS.baby
    : STAGE_DEFAULT_VIDEOS[stage] ?? STAGE_DEFAULT_VIDEOS.baby

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      {/* Glow / ripple overlay when reacting */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-20 rounded-full transition-all duration-500",
          isReacting
            ? "scale-110 opacity-100"
            : "scale-100 opacity-0"
        )}
        style={{
          background: isReacting
            ? "radial-gradient(circle, rgba(82,231,255,0.35) 0%, rgba(82,231,255,0.12) 40%, transparent 70%)"
            : "transparent",
          boxShadow: isReacting
            ? "0 0 40px rgba(82,231,255,0.4), 0 0 80px rgba(82,231,255,0.2), inset 0 0 30px rgba(82,231,255,0.15)"
            : "none",
        }}
      />

      {/* Pulse ring */}
      {isReacting && (
        <div
          className="pointer-events-none absolute inset-0 z-20 animate-ping rounded-full"
          style={{
            border: "2px solid rgba(82,231,255,0.3)",
            animation: "guto-pulse 1.2s ease-out",
          }}
        />
      )}

      {/* Video container */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-transparent",
          sizeClasses[size],
          isReacting && "scale-105",
        )}
        style={{
          transition: "transform 0.3s ease-out",
        }}
      >
        <video
          ref={videoRef}
          key={`${stage}-${isTouch ? "toque" : "default"}`}
          autoPlay
          muted
          loop={!isReacting}
          playsInline
          disablePictureInPicture
          controls={false}
          controlsList="nodownload noplaybackrate nofullscreen"
          preload="auto"
          className={cn(
            "guto-avatar-controller-video relative z-10 h-full w-full object-contain",
            isReacting ? "cursor-default" : "cursor-pointer",
          )}
          onClick={handleTap}
          onTouchEnd={(e) => {
            e.preventDefault()
            handleTap()
          }}
        >
          <source src={`/assets/guto/${videos.webm}`} type="video/webm" />
          <source src={`/assets/guto/${videos.mov}`} type="video/quicktime" />
        </video>
      </div>

      {/* Platform */}
      {showPlatform && (
        <div className="relative mt-[-0.5rem] flex w-full max-w-[10.5rem] items-center justify-center">
          <div className="absolute h-10 w-[72%] rounded-full bg-[radial-gradient(circle,rgba(82,231,255,0.12)_0%,rgba(82,231,255,0)_76%)] blur-xl" />
          <div className="relative h-5 w-[76%] rounded-full border border-white/82 bg-white/78 shadow-[inset_0_3px_10px_rgba(122,136,154,0.12),inset_0_-6px_10px_rgba(255,255,255,0.94)]">
            <div className="absolute inset-x-[14%] top-[20%] h-[58%] rounded-full border border-white/76 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(220,230,240,0.82)_100%)]" />
            <div className="absolute inset-x-[32%] top-[38%] h-[22%] rounded-full bg-[linear-gradient(90deg,transparent,rgba(82,231,255,0.74),transparent)]" />
          </div>
        </div>
      )}

      {/* Keyframes for pulse animation */}
      <style jsx>{`
        @keyframes guto-pulse {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
