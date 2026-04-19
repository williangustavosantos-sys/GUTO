"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GutoAvatarProps {
  size?: "sm" | "md" | "lg" | "xl"
  stage?: "baby" | "teen" | "adult" | "elite"
  showPlatform?: boolean
  className?: string
  animate?: boolean
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
}

const eyeSizes = {
  sm: "w-3 h-4",
  md: "w-5 h-6",
  lg: "w-6 h-8",
  xl: "w-8 h-10",
}

const pupilSizes = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-3 h-3",
  xl: "w-4 h-4",
}

const coreSizes = {
  sm: "w-3 h-3",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
}

export function GutoAvatar({ 
  size = "lg", 
  stage = "baby",
  showPlatform = true,
  className,
  animate = true 
}: GutoAvatarProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <motion.div
        className={cn(
          "relative flex items-center justify-center",
          sizeClasses[size]
        )}
        animate={animate ? { y: [0, -8, 0] } : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Body */}
        <div 
          className={cn(
            "relative rounded-full shadow-lg",
            sizeClasses[size]
          )}
          style={{
            background: "linear-gradient(180deg, white 0%, #f8fafc 50%, #f1f5f9 100%)",
            boxShadow: `
              0 4px 20px oklch(0.50 0.08 240 / 0.15),
              inset 0 -10px 30px oklch(0.85 0.05 240 / 0.3),
              inset 0 5px 15px white
            `
          }}
        >
          {/* Eyes Container */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex gap-3">
            {/* Left Eye */}
            <div 
              className={cn(
                "rounded-full flex items-center justify-center",
                eyeSizes[size]
              )}
              style={{
                background: "linear-gradient(180deg, #334155 0%, #0f172a 100%)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
              }}
            >
              <motion.div 
                className={cn(
                  "rounded-full bg-white",
                  pupilSizes[size]
                )}
                animate={{ x: [0, 1, 0, -1, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>
            {/* Right Eye */}
            <div 
              className={cn(
                "rounded-full flex items-center justify-center",
                eyeSizes[size]
              )}
              style={{
                background: "linear-gradient(180deg, #334155 0%, #0f172a 100%)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
              }}
            >
              <motion.div 
                className={cn(
                  "rounded-full bg-white",
                  pupilSizes[size]
                )}
                animate={{ x: [0, 1, 0, -1, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>
          </div>

          {/* Core/Chest Light */}
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2">
            <motion.div
              className={cn(
                "rounded-full",
                coreSizes[size]
              )}
              style={{
                background: "linear-gradient(180deg, #67e8f9 0%, #22d3ee 55%, #0ea5e9 100%)"
              }}
              animate={{
                boxShadow: [
                  "0 0 10px oklch(0.75 0.15 200 / 0.5), 0 0 20px oklch(0.75 0.15 200 / 0.3)",
                  "0 0 20px oklch(0.75 0.15 200 / 0.8), 0 0 40px oklch(0.75 0.15 200 / 0.5)",
                  "0 0 10px oklch(0.75 0.15 200 / 0.5), 0 0 20px oklch(0.75 0.15 200 / 0.3)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Arms - Small stubs */}
          <div 
            className="absolute top-1/2 -left-2 w-4 h-6 rounded-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(226,232,240,1) 100%)",
              boxShadow: "inset 0 -3px 10px oklch(0.85 0.05 240 / 0.5)"
            }}
          />
          <div 
            className="absolute top-1/2 -right-2 w-4 h-6 rounded-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(226,232,240,1) 100%)",
              boxShadow: "inset 0 -3px 10px oklch(0.85 0.05 240 / 0.5)"
            }}
          />
        </div>
      </motion.div>

      {/* Platform/Base */}
      {showPlatform && (
        <motion.div 
          className="relative mt-2"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Platform */}
          <div 
            className="w-20 h-4 rounded-full bg-slate-300/90"
            style={{
              boxShadow: `
                0 4px 12px oklch(0.50 0.08 240 / 0.15),
                inset 0 1px 0 oklch(0.70 0.05 240 / 0.35)
              `
            }}
          />
        </motion.div>
      )}

      {/* Stage Label */}
      {stage && (
        <div className="mt-2 px-3 py-1 rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200/50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {stage}
          </span>
        </div>
      )}
    </div>
  )
}
