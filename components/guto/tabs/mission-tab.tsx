"use client"

import { motion } from "framer-motion"
import { ChevronLeft, Check, Info, MessageCircle } from "lucide-react"
import { GutoOfficialAvatar } from "../guto-official-avatar"
import { getLanguage, translations } from "../translations"

interface MissionTabProps {
  userName: string
  language: string
}

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  rest: string
  image: string
  completed?: boolean
  xp?: number
}

export function MissionTab({ userName, language }: MissionTabProps) {
  const validLang = getLanguage(language)
  const locale = translations[validLang]

  const todayWorkout = {
    date: locale.workoutDate,
    focus: locale.workoutFocus,
    exercises: [
      {
        id: "1",
        name: locale.exercises[0].name,
        sets: 4,
        reps: 10,
        rest: locale.exercises[0].rest,
        image: "/exercises/incline-dumbbell.jpg",
      },
      {
        id: "2",
        name: locale.exercises[1].name,
        sets: 4,
        reps: 8,
        rest: locale.exercises[1].rest,
        image: "/exercises/bench-press.jpg",
      },
      {
        id: "3",
        name: locale.exercises[2].name,
        sets: 4,
        reps: 12,
        rest: locale.exercises[2].rest,
        image: "/exercises/triceps-rope.jpg",
      },
      {
        id: "4",
        name: locale.exercises[3].name,
        sets: 3,
        reps: 10,
        rest: locale.exercises[3].rest,
        image: "/exercises/close-grip.jpg",
        xp: 105,
      },
    ] as Exercise[],
    objectives: locale.workoutObjectives,
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button className="p-2 -ml-2 text-primary">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black tracking-tight text-foreground/90">
          {locale.missionTitle}
        </h1>
        <div className="w-16 -mr-2">
          <GutoOfficialAvatar size="sm" showPlatform={false} className="w-16 h-16" />
        </div>
      </div>

      {/* Date */}
      <div className="text-center pb-2">
        <span className="text-sm text-muted-foreground/60">
          {todayWorkout.date}
        </span>
      </div>

      {/* Workout focus */}
      <div className="px-4 mb-4">
        <h2 className="text-2xl font-bold text-foreground/90">
          {todayWorkout.focus}
        </h2>
      </div>

      {/* Exercises list */}
      <div className="px-4 space-y-3 flex-1">
        {todayWorkout.exercises.map((exercise, index) => (
          <motion.div
            key={exercise.id}
            className="glass-strong rounded-2xl overflow-hidden"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex gap-3 p-3">
              {/* Exercise image placeholder */}
              <div 
                className="w-24 h-20 rounded-xl shrink-0 relative overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(135deg, oklch(0.85 0.02 240) 0%, oklch(0.75 0.03 240) 100%)`,
                }}
              >
                {/* Silhouette of person exercising */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg 
                    viewBox="0 0 40 40" 
                    className="w-12 h-12 text-slate-400/50"
                    fill="currentColor"
                  >
                    <circle cx="20" cy="8" r="4" />
                    <path d="M12 18 L20 14 L28 18 L26 28 L22 28 L20 36 L18 28 L14 28 Z" />
                  </svg>
                </div>
              </div>

              {/* Exercise details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-foreground/90 leading-tight pr-2">
                    {exercise.name}
                  </h3>
                  <button className="shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Info className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {exercise.sets} {locale.setsLabel} | {exercise.reps} {locale.repsLabel} | {exercise.rest} {locale.restLabel}
                </p>
                {exercise.xp && (
                  <p className="text-sm font-semibold text-primary mt-1">
                    +{exercise.xp} XP
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Objectives */}
      <motion.div
        className="px-4 py-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="font-bold text-foreground/80 mb-2">{locale.objectivesTitle}</h3>
        <div className="space-y-2">
          {todayWorkout.objectives.map((obj, index) => (
            <div key={index} className="flex items-start gap-2">
              {index === 0 ? (
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              ) : (
                <MessageCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              )}
              <span className="text-sm text-foreground/70">{obj}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
