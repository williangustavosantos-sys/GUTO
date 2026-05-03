"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Zap } from "lucide-react"

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

type FlowStep = "intro" | "ready" | "camera" | "countdown" | "speaking" | "uploading" | "success"

const copy = {
  "pt-BR": {
    title: "Validar treino",
    badge: "GUTO VALIDATION",
    instructions: [
      "Autorize a câmera quando solicitado",
      "Posicione o rosto dentro do círculo",
      "Aguarde a contagem 3, 2, 1",
      "Fale a frase em voz alta",
    ],
    cta: "COMEÇAR",
    readyTitle: "Posicione o rosto",
    faceHint: "Encaixe o rosto no círculo",
    ready: "ESTOU PRONTO",
    phrase: "TREINO FEITO, GUTO",
    phraseHint: "Fale em voz alta",
    uploading: "Validando missão...",
    validated: "VALIDADO",
    xpLabel: "XP conquistado",
    seeInJourney: "VER NO PERCURSO",
    faceStable: "Segure firme...",
    noCamera: "Câmera não autorizada. Permita o acesso nas configurações do dispositivo.",
    retry: "TENTAR NOVAMENTE",
    cameraError: "Não foi possível acessar a câmera.",
    errorTitle: "Algo deu errado",
  },
  "en-US": {
    title: "Validate workout",
    badge: "GUTO VALIDATION",
    instructions: [
      "Allow camera access when prompted",
      "Position your face in the circle",
      "Wait for the 3, 2, 1 countdown",
      "Say the phrase out loud",
    ],
    cta: "START",
    readyTitle: "Position your face",
    faceHint: "Fit your face in the circle",
    ready: "I AM READY",
    phrase: "WORKOUT DONE, GUTO",
    phraseHint: "Say it out loud",
    uploading: "Validating mission...",
    validated: "VALIDATED",
    xpLabel: "XP earned",
    seeInJourney: "SEE IN JOURNEY",
    faceStable: "Hold still...",
    noCamera: "Camera not allowed. Enable access in your device settings.",
    retry: "TRY AGAIN",
    cameraError: "Could not access the camera.",
    errorTitle: "Something went wrong",
  },
  "it-IT": {
    title: "Valida allenamento",
    badge: "GUTO VALIDATION",
    instructions: [
      "Autorizza la fotocamera quando richiesto",
      "Posiziona il viso nel cerchio",
      "Aspetta il conto alla rovescia 3, 2, 1",
      "Di' la frase ad alta voce",
    ],
    cta: "INIZIA",
    readyTitle: "Posiziona il viso",
    faceHint: "Inserisci il viso nel cerchio",
    ready: "SONO PRONTO",
    phrase: "ALLENAMENTO FATTO, GUTO",
    phraseHint: "Dillo ad alta voce",
    uploading: "Convalidando missione...",
    validated: "VALIDATO",
    xpLabel: "XP guadagnato",
    seeInJourney: "VEDI NEL PERCORSO",
    faceStable: "Tieni fermo...",
    noCamera: "Fotocamera non autorizzata. Abilita l'accesso nelle impostazioni del dispositivo.",
    retry: "RIPROVA",
    cameraError: "Impossibile accedere alla fotocamera.",
    errorTitle: "Qualcosa è andato storto",
  },
  "es-ES": {
    title: "Validar entrenamiento",
    badge: "GUTO VALIDATION",
    instructions: [
      "Autoriza la cámara cuando se solicite",
      "Coloca el rostro en el círculo",
      "Espera la cuenta 3, 2, 1",
      "Di la frase en voz alta",
    ],
    cta: "EMPEZAR",
    readyTitle: "Coloca el rostro",
    faceHint: "Ajusta el rostro en el círculo",
    ready: "ESTOY LISTO",
    phrase: "ENTRENAMIENTO HECHO, GUTO",
    phraseHint: "Dilo en voz alta",
    uploading: "Validando misión...",
    validated: "VALIDADO",
    xpLabel: "XP ganado",
    seeInJourney: "VER EN RECORRIDO",
    faceStable: "Mantén firme...",
    noCamera: "Cámara no autorizada. Permite el acceso en la configuración del dispositivo.",
    retry: "INTENTAR DE NUEVO",
    cameraError: "No se pudo acceder a la cámara.",
    errorTitle: "Algo salió mal",
  },
} as const

// Light app background — matches .sala-guto gradient
const APP_BG = "linear-gradient(180deg, #edf2f7 0%, #dfe7f0 100%)"

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
  const [faceProgress, setFaceProgress] = useState(0) // 0-100, progresso de detecção
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
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // face-detection refs
  const rafRef = useRef<number | null>(null)
  const faceStableCountRef = useRef(0)
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null)
  const faceLockedRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    if (speakingTimerRef.current !== null) {
      clearTimeout(speakingTimerRef.current)
      speakingTimerRef.current = null
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    clearTimers()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [clearTimers])

  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return ""
    canvas.width = video.videoWidth || 1080
    canvas.height = video.videoHeight || 1440
    const ctx = canvas.getContext("2d")
    if (!ctx) return ""
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.8)
  }, [])

  const startCameraCountdown = useCallback(() => {
    setStep("countdown")
    setCountdown(3)

    let count = 3
    const tick = () => {
      count -= 1
      if (count > 0) {
        setCountdown(count)
        countdownTimerRef.current = setTimeout(tick, 1000)
      } else {
        setCountdown(0)
        setStep("speaking")
        speakingTimerRef.current = setTimeout(() => {
          speakingTimerRef.current = null
          const dataUrl = capturePhoto()
          imageBase64Ref.current = dataUrl
          stopCamera()
          setStep("uploading")
        }, 3000)
      }
    }
    countdownTimerRef.current = setTimeout(tick, 1000)
  }, [capturePhoto, stopCamera])

  const openCamera = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError(copy[language]?.noCamera ?? copy["pt-BR"].noCamera)
      return
    }
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: false,
      })
      // Stream ready BEFORE advancing — garante que streamRef nunca é null no step "camera"
      streamRef.current = stream
      setStep("ready")
    } catch (err) {
      const msg = copy[language] ?? copy["pt-BR"]
      setCameraError(
        err instanceof Error && err.name === "NotAllowedError" ? msg.noCamera : msg.cameraError
      )
    }
  }, [language])

  // Detecção de presença por análise de pixel na região central do frame.
  // Sem ML — verifica luminosidade (rosto presente) + estabilidade (parado).
  // Quando estável por ~1s, ring chega a 100% e countdown começa.
  const startFaceDetection = useCallback((video: HTMLVideoElement) => {
    const ac = document.createElement("canvas")
    ac.width = 20
    ac.height = 20
    const ctx = ac.getContext("2d", { willReadFrequently: true })

    faceStableCountRef.current = 0
    faceLockedRef.current = false
    prevFrameDataRef.current = null
    setFaceProgress(0)

    const TOTAL = 30 // ~1 s a 30 fps

    if (!ctx) {
      // Fallback sem canvas: inicia direto após 2 s
      countdownTimerRef.current = setTimeout(() => {
        if (streamRef.current) startCameraCountdown()
      }, 2000)
      return
    }

    const analyze = () => {
      if (!streamRef.current || faceLockedRef.current) return

      const vw = video.videoWidth || 640
      const vh = video.videoHeight || 480
      const size = Math.min(vw, vh) * 0.38
      const sx = (vw - size) / 2
      const sy = (vh - size) / 2

      try {
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 20, 20)
        const { data } = ctx.getImageData(0, 0, 20, 20)
        const prev = prevFrameDataRef.current

        let bright = 0
        let motion = 0
        for (let i = 0; i < data.length; i += 4) {
          const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
          if (lum > 25) bright++
          if (prev) {
            motion +=
              Math.abs(data[i] - prev[i]) +
              Math.abs(data[i + 1] - prev[i + 1]) +
              Math.abs(data[i + 2] - prev[i + 2])
          }
        }

        prevFrameDataRef.current = new Uint8ClampedArray(data)

        const hasFace = bright / 400 > 0.15          // alguma coisa na região
        const isStable = !prev || motion / 400 < 20  // pouco movimento

        if (hasFace && isStable) {
          faceStableCountRef.current = Math.min(TOTAL, faceStableCountRef.current + 1)
        } else {
          faceStableCountRef.current = Math.max(0, faceStableCountRef.current - 2)
        }

        const pct = Math.round((faceStableCountRef.current / TOTAL) * 100)
        setFaceProgress(pct)

        if (faceStableCountRef.current >= TOTAL) {
          faceLockedRef.current = true
          // 400 ms de feedback visual antes de iniciar contagem
          countdownTimerRef.current = setTimeout(() => {
            if (streamRef.current) startCameraCountdown()
          }, 400)
          return
        }
      } catch {
        // frame ainda não disponível
      }

      rafRef.current = requestAnimationFrame(analyze)
    }

    rafRef.current = requestAnimationFrame(analyze)
  }, [startCameraCountdown])

  // Ref callback no <video> — conecta stream no momento exato da montagem.
  // AnimatePresence mode="wait" atrasa a montagem do step "camera" até a
  // animação de saída do "ready" terminar; useEffect dispararia cedo demais.
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node
    if (!node || !streamRef.current) return
    node.srcObject = streamRef.current
    void node.play().catch(() => {})
    const onReady = () => { if (streamRef.current) startFaceDetection(node) }
    if (node.readyState >= 2) {
      onReady()
    } else {
      node.addEventListener("canplay", onReady, { once: true })
    }
  }, [startFaceDetection])

  // Call API when uploading
  useEffect(() => {
    if (step !== "uploading") return
    let cancelled = false
    void validateWorkout({
      userId,
      imageBase64: imageBase64Ref.current,
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
        setUploadError(err instanceof Error ? err.message : "Erro ao validar missão.")
      })
    return () => { cancelled = true }
  }, [step, userId, workoutFocus, workoutLabel, language])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: APP_BG }}
    >
      <AnimatePresence mode="wait">

        {/* ── INTRO ─────────────────────────────────────────────────────── */}
        {step === "intro" && (
          <motion.div
            key="intro"
            className="relative flex h-full flex-col items-center justify-center px-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="guto-slot absolute right-5 top-[max(env(safe-area-inset-top),1.1rem)] grid h-9 w-9 place-items-center rounded-full"
              aria-label="Fechar"
            >
              <X className="h-4 w-4 text-[var(--guto-navy)]" />
            </button>

            <div className="guto-frost-panel w-full max-w-[22rem] rounded-[2rem] p-6">
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-[var(--guto-cyan)]">
                {locale.badge}
              </span>
              <h1 className="mb-5 mt-1 text-[1.3rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
                {locale.title}
              </h1>

              <ol className="space-y-3">
                {locale.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="guto-deboss-deep mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[10px] font-black text-[var(--guto-cyan)]">
                      {i + 1}
                    </span>
                    <span className="text-[13px] leading-snug text-[rgba(13,35,65,0.7)]">
                      {inst}
                    </span>
                  </li>
                ))}
              </ol>

              {cameraError && (
                <p className="mt-5 rounded-[0.85rem] border border-[rgba(157,43,43,0.18)] bg-[rgba(157,43,43,0.07)] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--destructive)]">
                  {cameraError}
                </p>
              )}

              <button
                type="button"
                onClick={() => void openCamera()}
                className="guto-deboss-deep mt-6 h-[3.25rem] w-full rounded-[1.2rem] border border-[rgba(82,231,255,0.42)] font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[var(--guto-cyan)]"
              >
                {locale.cta}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── READY ─────────────────────────────────────────────────────── */}
        {step === "ready" && (
          <motion.div
            key="ready"
            className="relative flex h-full flex-col items-center justify-center px-6"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="guto-slot absolute right-5 top-[max(env(safe-area-inset-top),1.1rem)] grid h-9 w-9 place-items-center rounded-full"
              aria-label="Fechar"
            >
              <X className="h-4 w-4 text-[var(--guto-navy)]" />
            </button>

            <div className="guto-frost-panel w-full max-w-[22rem] rounded-[2rem] p-6">
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-[var(--guto-cyan)]">
                {locale.badge}
              </span>
              <h1 className="mb-5 mt-1 text-[1.3rem] font-black uppercase leading-tight tracking-[0.08em] text-[var(--guto-navy)]">
                {locale.readyTitle}
              </h1>

              {/* Face circle preview */}
              <div className="flex flex-col items-center py-2">
                <div
                  className="guto-deboss-deep grid place-items-center rounded-full"
                  style={{
                    width: 180,
                    height: 180,
                    boxShadow: "inset 5px 5px 14px rgba(129,141,156,0.18), inset -7px -7px 15px rgba(255,255,255,0.96), 0 0 0 3px rgba(82,231,255,0.38)",
                  }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[rgba(13,35,65,0.35)]">
                    {locale.faceHint}
                  </span>
                </div>
              </div>

              {/* Phrase preview */}
              <div className="guto-slot mt-4 rounded-[1rem] px-4 py-3 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[rgba(13,35,65,0.42)]">
                  {locale.phraseHint}
                </p>
                <p className="mt-1 font-black uppercase tracking-[0.08em] text-[var(--guto-navy)]" style={{ fontSize: "clamp(0.9rem,4vw,1.1rem)" }}>
                  {locale.phrase}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep("camera")}
                className="guto-deboss-deep mt-5 h-[3.25rem] w-full rounded-[1.2rem] border border-[rgba(82,231,255,0.42)] font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[var(--guto-cyan)]"
              >
                {locale.ready}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── CAMERA / COUNTDOWN / SPEAKING ─────────────────────────────── */}
        {(step === "camera" || step === "countdown" || step === "speaking") && (
          <motion.div
            key="camera-view"
            className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <canvas ref={canvasRef} className="hidden" />

            <video
              ref={videoCallbackRef}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Vignette */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,rgba(0,0,0,0.68)_76%)]" />

            {/* Close */}
            <button
              type="button"
              onClick={() => { stopCamera(); onClose() }}
              className="absolute right-5 top-[max(env(safe-area-inset-top),1.1rem)] z-30 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/30"
              aria-label="Fechar"
            >
              <X className="h-4 w-4 text-white" />
            </button>

            {/* Face ring com progresso SVG */}
            {(() => {
              const R = 107
              const CIRC = 2 * Math.PI * R
              const locked = faceProgress >= 100
              const dashOffset = CIRC * (1 - faceProgress / 100)
              const hintText =
                step !== "camera" ? null
                : locked ? "✓"
                : faceProgress > 0 ? locale.faceStable
                : locale.faceHint
              return (
                <div className="pointer-events-none relative z-10 flex flex-col items-center">
                  <div style={{ width: 220, height: 220, position: "relative" }}>
                    {/* SVG arc de progresso */}
                    <svg
                      width="220" height="220"
                      className="absolute inset-0"
                      style={{ transform: "rotate(-90deg)" }}
                    >
                      {/* trilho */}
                      <circle cx="110" cy="110" r={R} fill="none"
                        stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                      {/* progresso */}
                      <circle cx="110" cy="110" r={R} fill="none"
                        stroke={locked ? "#52e7ff" : "rgba(82,231,255,0.88)"}
                        strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={CIRC}
                        strokeDashoffset={dashOffset}
                        style={{ transition: "stroke-dashoffset 0.08s linear, stroke 0.3s ease" }}
                      />
                    </svg>
                    {/* círculo interno guia */}
                    <div className="absolute inset-0 rounded-full"
                      style={{
                        border: `3px solid ${locked ? "rgba(82,231,255,0.5)" : "rgba(255,255,255,0.14)"}`,
                        boxShadow: locked ? "0 0 28px rgba(82,231,255,0.32)" : "none",
                        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                      }}
                    />
                  </div>
                  {hintText !== null && (
                    <p className="mt-3 font-mono text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{
                        color: faceProgress > 0 ? "rgba(82,231,255,0.95)" : "rgba(255,255,255,0.6)",
                        transition: "color 0.3s ease",
                      }}>
                      {hintText}
                    </p>
                  )}
                </div>
              )
            })()}

            {/* Countdown overlay */}
            <AnimatePresence mode="wait">
              {step === "countdown" && countdown !== null && countdown > 0 && (
                <motion.div
                  key={`count-${countdown}`}
                  className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 1.35 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.65 }}
                  transition={{ duration: 0.26 }}
                >
                  <span
                    className="font-black text-white"
                    style={{ fontSize: "7.5rem", lineHeight: 1, textShadow: "0 0 36px rgba(82,231,255,0.55)" }}
                  >
                    {countdown}
                  </span>
                </motion.div>
              )}

              {step === "speaking" && (
                <motion.div
                  key="phrase"
                  className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[rgba(13,35,65,0.66)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[rgba(82,231,255,0.65)]">
                    {locale.phraseHint}
                  </p>
                  <p
                    className="px-8 text-center font-black uppercase text-[var(--guto-cyan)]"
                    style={{
                      fontSize: "clamp(1.5rem,6.5vw,2.1rem)",
                      letterSpacing: "0.1em",
                      textShadow: "0 0 28px rgba(82,231,255,0.55)",
                    }}
                  >
                    {locale.phrase}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera error */}
            {cameraError && (
              <div className="absolute inset-x-6 bottom-20 z-30 rounded-[1.5rem] bg-[rgba(13,35,65,0.9)] px-6 py-5 text-center" style={{ backdropFilter: "blur(8px)" }}>
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[rgba(255,140,140,0.9)]">
                  {cameraError}
                </p>
                <button
                  type="button"
                  onClick={() => { setCameraError(null); stopCamera(); setStep("intro") }}
                  className="rounded-full border border-[rgba(82,231,255,0.3)] bg-[rgba(82,231,255,0.12)] px-6 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--guto-cyan)]"
                >
                  {locale.retry}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── UPLOADING ─────────────────────────────────────────────────── */}
        {step === "uploading" && (
          <motion.div
            key="uploading"
            className="relative flex h-full flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {uploadError ? (
              <div className="guto-frost-panel w-full max-w-[22rem] rounded-[2rem] p-6 text-center">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[var(--guto-cyan)]">
                  {locale.badge}
                </p>
                <h2 className="mt-2 mb-4 text-[1.1rem] font-black uppercase tracking-[0.06em] text-[var(--guto-navy)]">
                  {locale.errorTitle}
                </h2>
                <p className="mb-5 text-[12px] leading-relaxed text-[rgba(13,35,65,0.62)]">
                  {uploadError}
                </p>
                <button
                  type="button"
                  onClick={() => { setUploadError(null); setStep("intro") }}
                  className="guto-deboss-deep h-[3.25rem] w-full rounded-[1.2rem] border border-[rgba(82,231,255,0.42)] font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[var(--guto-cyan)]"
                >
                  {locale.retry}
                </button>
              </div>
            ) : (
              <div className="guto-frost-panel flex w-full max-w-[22rem] flex-col items-center gap-5 rounded-[2rem] px-6 py-10">
                <motion.div
                  className="h-14 w-14 rounded-full border-[3px] border-[rgba(13,35,65,0.1)] border-t-[var(--guto-cyan)]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-[rgba(13,35,65,0.5)]">
                  {locale.uploading}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── SUCCESS ───────────────────────────────────────────────────── */}
        {step === "success" && validationResult && (
          <motion.div
            key="success"
            className="relative flex h-full flex-col items-center justify-center px-6"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="guto-frost-panel w-full max-w-[22rem] rounded-[2rem] p-6">
              {/* Badge */}
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-[var(--guto-cyan)]">
                {locale.badge}
              </p>

              {/* XP ring */}
              <div className="my-5 flex flex-col items-center gap-2">
                <motion.div
                  className="guto-deboss-deep grid h-24 w-24 place-items-center rounded-full border border-[rgba(82,231,255,0.38)]"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Zap className="h-8 w-8 text-[var(--guto-cyan)]" style={{ filter: "drop-shadow(0 0 8px rgba(82,231,255,0.45))" }} />
                </motion.div>

                <motion.p
                  className="font-mono text-[2rem] font-black tracking-[0.06em] text-[var(--guto-cyan)]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                >
                  +{validationResult.validation.xp} XP
                </motion.p>

                <motion.p
                  className="font-mono text-[9px] uppercase tracking-[0.2em] text-[rgba(13,35,65,0.4)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.24 }}
                >
                  {locale.xpLabel}
                </motion.p>
              </div>

              {/* VALIDADO heading */}
              <motion.div
                className="guto-slot rounded-[1rem] px-4 py-3 text-center"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4 rounded-full bg-[rgba(82,231,255,0.22)] p-[3px] text-[var(--guto-cyan)]" />
                  <span className="font-mono text-[12px] font-black uppercase tracking-[0.22em] text-[var(--guto-navy)]">
                    {locale.validated}
                  </span>
                </div>
              </motion.div>

              {/* GUTO message */}
              {validationResult.validation.gutoMessage && (
                <motion.p
                  className="mt-4 text-center text-[12px] leading-relaxed text-[rgba(13,35,65,0.62)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.34 }}
                >
                  {validationResult.validation.gutoMessage}
                </motion.p>
              )}

              {/* CTA */}
              <motion.button
                type="button"
                onClick={() => onComplete(validationResult.validationHistory)}
                className="guto-deboss-deep mt-6 h-[3.25rem] w-full rounded-[1.2rem] border border-[rgba(82,231,255,0.42)] font-mono text-[11px] font-black uppercase tracking-[0.2em] text-[var(--guto-cyan)]"
                initial={{ opacity: 0, y: 6 }}
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
