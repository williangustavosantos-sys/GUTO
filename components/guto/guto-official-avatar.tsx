"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GutoOfficialAvatarProps {
  size?: "sm" | "md" | "lg" | "xl"
  showPlatform?: boolean
  className?: string
}

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-40 h-40",
  xl: "w-52 h-52",
}

export function GutoOfficialAvatar({
  size = "lg",
  showPlatform = true,
  className,
}: GutoOfficialAvatarProps) {
  return (
    <div
      className={cn(
        "relative mx-auto bg-transparent flex items-center justify-center pointer-events-none",
        sizeClasses[size],
        className
      )}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)' 
      }}
    >
      <motion.div
        className="relative w-full h-full bg-transparent"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain scale-105 pointer-events-none bg-transparent"
        >
          <source src="/avatar/GUTO-BABY_alpha.webm" type="video/webm" />
        </video>
      </motion.div>

      {showPlatform && (
        <div className="absolute inset-x-[26%] bottom-2 h-4 rounded-full bg-slate-200/60 shadow-[0_8px_20px_rgba(30,41,59,0.12)]" />
      )}
    </div>
  )
}
