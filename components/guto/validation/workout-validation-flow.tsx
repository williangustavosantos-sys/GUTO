"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

import type { SupportedLanguage, WorkoutValidationRecord } from "@/lib/api/guto"
import { validateWorkout } from "@/lib/api/guto"

interface WorkoutValidationFlowProps {
  language: SupportedLanguage
  userId: string
  workoutFocus: string
  workoutLabel: string
  onComplete: (validationHistory: WorkoutValidationRecord[]) => void
  onClose: () => void
}

type FlowStep = "intro" | "camera" | "uploading" | "success"

const copy = {
  "pt-BR": {
    title: "Validar treino",
    instructions: [
      "Autorize a câmera",
      "Posicione o rosto dentro do círculo",
      "Fique parado por 3 segundos",
      "Fale em voz alta a frase da tela",
    ],
    cta: "COMEÇAR",
    faceHint: "Encaixe o rosto no círculo",
    phrase: "TREINO FEITO, GUTO",
    uploading: "Validando missão...",
    validated: "VALIDADO",
    seeInJourney: "VER NO PERCURSO",
    noCamera: "Sem câmera, sem validação. Autoriza e fecha a missão direito.",
    retry: "TENTAR NOVAMENTE",
    cameraError: "Não foi possível acessar a câmera.",
  },
  "en-US": {
    title: "Validate workout",
    instructions: [
      "Allow camera access",
      "Position your face in the circle",
      "Hold still for 3 seconds",
      "Say the phrase on screen out loud",
    ],
    cta: "START",
    faceHint: "Position your face in the circle",
    phrase: "WORKOUT DONE, GUTO",
    uploading: "Validating mission...",
    validated: "VALIDATED",
    seeInJourney: "SEE IN JOURNEY",
    noCamera: "No camera, no validation. Allow access and close the mission right.",
    retry: "TRY AGAIN",
    cameraError: "Could not access the camera.",
  },
  "it-IT": {
    title: "Valida allenamento",
    instructions: [
      "Autorizza la fotocamera",
      "Posiziona il viso nel cerchio",
      "Rimani fermo per 3 secondi",
      "Di' la frase sullo schermo ad alta voce",
    ],
    cta: "INIZIA",
    faceHint: "Posiziona il viso nel cerchio",
    phrase: "ALLENAMENTO FATTO, GUTO",
    uploading: "Convalidando missione...",
    validated: "VALIDATO",
    seeInJourney: "VEDI NEL PERCORSO",
    noCamera: "Senza fotocamera, nessuna validazione. Autorizza e chiudi la missione nel modo giusto.",
    retry: "RIPROVA",
    cameraError: "Impossibile accedere alla fotocamera.",
  },
  "es-ES": {
    title: "Validar entrenamiento",
    instructions: [
      "Autoriza la cámara",
      "Coloca el rostro en el círculo",
      "Quédate quieto por 3 segundos",
      "Di en voz alta la frase de la pantalla",
    ],
    cta: "EMPEZAR",
    faceHint: "Coloca el rostro en el círculo",
    phrase: "ENTRENAMIENTO HECHO, GUTO",
    uploading: "Validando misión...",
    validated: "VALIDADO",
    seeInJourney: "VER EN RECORRIDO",
    noCamera: "Sin cámara, sin validación. Autoriza y cierra la misión bien.",
    retry: "INTENTAR DE NUEVO",
    cameraError: "No se pudo acceder a la cámara.",
  },
} as const

export function WorkoutValidationFlow({
  language,
  userId,
  workoutFocus,
  workoutLabel,
  onComplete,
  onClose,
}: WorkoutValidationFlowProps) {
  const locale = copy[language] ?? copy["pt-BR"]

  const [step, setStep] = useState<FlowStep>("intro")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [showPhrase, setShowPhrase] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<{
    validation: WorkoutValidationRecord
    validationHistory: WorkoutValidationRecord[]
  } | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const imageBase64Ref = useRef<string>("")

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return ""

    canvas.width = video.videoWidth || 1080
    canvas.height = video.videoHeight || 1440
    const ctx = canvas.getContext("2d")
    if (!ctx) return ""

    // Mirror horizontally to match front camera preview
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL("image/jpeg", 0.8)
  }, [])

  const startCameraCountdown = useCallback(() => {
    setCountdown(3)
    setShowPhrase(false)

    let count = 3
    const tick = () => {
      count -= 1
      if (count > 0) {
        setCountdown(count)
        setTimeout(tick, 1000)
      } else {
        setCountdown(0)
        setShowPhrase(true)
        setTimeout(() => {
          const dataUrl = capturePhoto()
          imageBase64Ref.current = dataUrl
          stopCamera()
          setStep("uploading")
        }, 1500)
      }
    }
    setTimeout(tick, 1000)
  }, [capturePhoto, stopCamera])

  const openCamera = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError(locale.noCamera)
      return
    }

    setCameraError(null)
    setStep("camera")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false,
      })

      streamRef.current = stream

      // Wait for video element to be in DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
          startCameraCountdown()
        }
      }, 200)
    } catch (err) {
      const message = err instanceof Error && err.name === "NotAllowedError"
        ? locale.noCamera
        : locale.cameraError
      setCameraError(message)
    }
  }, [locale.cameraError, locale.noCamera, startCameraCountdown])

  // Call API after transition to uploading
  useEffect(() => {
    if (step !== "uploading") return

    let cancelled = false
    const imageBase64 = imageBase64Ref.current

    void validateWorkout({
      userId,
      imageBase64,
      workoutFocus,
      workoutLabel,
      locationMode: "gym",
      language,
    })
      .then((result) => {
        if (cancelled) return
        setValidationResult({ validation: result.validation, validationHistory: result.validationHistory })
        setStep("success")
      })
      .catch((err) => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : "Erro ao validar missão."
        setUploadError(msg)
      })

    return () => {
      cancelled = true
    }
  }, [step, userId, workoutFocus, workoutLabel, language])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--guto-navy)]" style={{ background: "var(--guto-navy, #0D2341)" }}>
      <AnimatePresence mode="wait">
        {/* INTRO STEP */}
        {step === "intro" && (
          <motion.div
            key="intro"
            className="flex h-full flex-col items-center justify-center px-8"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.36 }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-[max(env(safe-area-inset-top),1.1rem)] grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-white"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="guto-frost-panel w-full max-w-[22rem] rounded-[2rem] p-6"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}>
              <p className="mb-1 font-mono text-[9px] font-black uppercase tracking-[0.24em] text-[rgba(82,231,255,0.7)]">
                GUTO VALIDATION
              </p>
              <h1 className="mb-6 text-[1.35rem] font-black uppercase leading-tight tracking-[0.08em] text-white">
                {locale.title}
              </h1>

              <ol className="space-y-3">
                {locale.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[rgba(82,231,255,0.18)] font-mono text-[11px] font-black text-[var(--guto-cyan,#52E7FF)]">
                      {index + 1}
                    </span>
                    <span className="text-[13px] font-medium leading-snug text-white/80">
                      {instruction}
                    </span>
                  </li>
                ))}
              </ol>

              {cameraError && (
                <p className="mt-4 rounded-[1rem] bg-[rgba(255,80,80,0.15)] px-4 py-3 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-[rgba(255,140,140,0.9)]">
                  {cameraError}
                </p>
              )}

              <button
                type="button"
                onClick={() => void openCamera()}
                className="mt-6 h-13 w-full rounded-[1.2rem] bg-[var(--guto-cyan,#52E7FF)] font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[var(--guto-navy,#0D2341)]"
                style={{ height: "3.25rem" }}
              >
                {locale.cta}
              </button>
            </div>
          </motion.div>
        )}

        {/* CAMERA STEP */}
        {step === "camera" && (
          <motion.div
            key="camera"
            className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Video feed */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Overlay dark vignette */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,rgba(0,0,0,0.72)_78%)]" />

            {/* Face circle ring */}
            <div className="pointer-events-none relative z-10 flex flex-col items-center">
              <div
                className="rounded-full border-4 border-[rgba(82,231,255,0.82)]"
                style={{
                  width: "220px",
                  height: "220px",
                  boxShadow: "0 0 24px rgba(82,231,255,0.28), inset 0 0 24px rgba(82,231,255,0.06)",
                }}
              />
              <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                {locale.faceHint}
              </p>
            </div>

            {/* Countdown overlay */}
            <AnimatePresence mode="wait">
              {countdown !== null && countdown > 0 && !showPhrase && (
                <motion.div
                  key={`count-${countdown}`}
                  className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 1.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.28 }}
                >
                  <span
                    className="font-black text-white"
                    style={{ fontSize: "7rem", lineHeight: 1, textShadow: "0 0 32px rgba(82,231,255,0.6)" }}
                  >
                    {countdown}
                  </span>
                </motion.div>
              )}

              {showPhrase && (
                <motion.div
                  key="phrase"
                  className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[rgba(13,35,65,0.72)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p
                    className="px-6 text-center font-black uppercase text-[var(--guto-cyan,#52E7FF)]"
                    style={{
                      fontSize: "clamp(1.4rem, 6vw, 2rem)",
                      letterSpacing: "0.1em",
                      textShadow: "0 0 24px rgba(82,231,255,0.6)",
                    }}
                  >
                    {locale.phrase}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera error */}
            {cameraError && (
              <div className="absolute inset-x-6 bottom-20 z-30 rounded-[1.5rem] bg-[rgba(13,35,65,0.92)] px-6 py-5 text-center"
                style={{ backdropFilter: "blur(8px)" }}>
                <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[rgba(255,140,140,0.9)]">
                  {cameraError}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCameraError(null)
                    setStep("intro")
                  }}
                  className="rounded-full bg-[rgba(82,231,255,0.18)] px-6 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--guto-cyan,#52E7FF)]"
                >
                  {locale.retry}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* UPLOADING STEP */}
        {step === "uploading" && (
          <motion.div
            key="uploading"
            className="flex h-full flex-col items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {uploadError ? (
              <div className="guto-frost-panel w-full max-w-[22rem] rounded-[2rem] p-6 text-center"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}>
                <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-[rgba(255,140,140,0.9)]">
                  {uploadError}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setUploadError(null)
                    setStep("intro")
                  }}
                  className="rounded-[1rem] bg-[rgba(82,231,255,0.18)] px-6 py-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--guto-cyan,#52E7FF)]"
                >
                  {locale.retry}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                {/* Spinner */}
                <motion.div
                  className="h-16 w-16 rounded-full border-4 border-[rgba(82,231,255,0.22)] border-t-[rgba(82,231,255,0.9)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-white/70">
                  {locale.uploading}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* SUCCESS STEP */}
        {step === "success" && validationResult && (
          <motion.div
            key="success"
            className="flex h-full flex-col items-center justify-center px-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="guto-frost-panel w-full max-w-[22rem] rounded-[2rem] p-6 text-center"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}>
              <motion.p
                className="text-[3.5rem] font-black uppercase leading-none tracking-[0.08em] text-white"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {locale.validated}
              </motion.p>

              <motion.p
                className="mt-2 font-mono text-[1.5rem] font-black tracking-[0.12em] text-[var(--guto-cyan,#52E7FF)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ textShadow: "0 0 20px rgba(82,231,255,0.5)" }}
              >
                +{validationResult.validation.xp} XP
              </motion.p>

              <motion.p
                className="mt-5 text-[13px] leading-relaxed text-white/72"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {validationResult.validation.gutoMessage}
              </motion.p>

              <motion.button
                type="button"
                onClick={() => onComplete(validationResult.validationHistory)}
                className="mt-7 h-13 w-full rounded-[1.2rem] bg-[var(--guto-cyan,#52E7FF)] font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[var(--guto-navy,#0D2341)]"
                style={{ height: "3.25rem" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.97 }}
              >
                {locale.seeInJourney}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
