"use client"

/**
 * Guto3DAvatar — Avatar 3D interativo via Three.js / React Three Fiber
 *
 * ARQUITETURA:
 * - Renderiza o modelo GLB com fundo 100% transparente (gl.alpha = true)
 * - Material PBR melhorado em runtime: metalness 0→0.45, roughness 0.9→0.35
 * - Rig de iluminação premium: ambient + directional + cyan rim light
 * - Float procedural (seno suave) em useFrame
 * - Tilt 3D real: recebe tiltX/tiltY do pai e aplica ao grupo do modelo
 * - Squish: animado com spring em useFrame (sem Framer Motion)
 * - Simulação de "piscar": Point Light pulsante na posição dos olhos
 * - Carregamento lazy com Suspense para não bloquear o app
 *
 * LIMITAÇÃO ATUAL:
 * - Os modelos têm textura baked single-mesh — olhos fazem parte da textura.
 *   Para piscar de verdade, re-exportar com mesh dos olhos separado + morph target.
 *   Por ora: pulsação de luz azul simula vida nos olhos.
 */

import { Suspense, useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import type { EvolutionStage } from "@/types/contract"

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Guto3DAvatarProps {
  stage: EvolutionStage
  isSuperMode?: boolean
  /**
   * Chamado a cada frame pelo useFrame — retorna {x, y} em graus.
   * Usar callbacks evita re-renders do React para cada mudança de tilt.
   */
  getTilt?: () => { x: number; y: number }
  /**
   * Chamado a cada frame — retorna escala atual (1.0 = normal, <1 = squish).
   * Se omitido, o avatar tem seu próprio squish idle.
   */
  getSquish?: () => number
  className?: string
}

// ── URL do modelo ─────────────────────────────────────────────────────────────
function modelUrl(stage: EvolutionStage, isSuper: boolean): string {
  const stageMap: Record<EvolutionStage, string> = {
    baby:  "baby",
    teen:  "teen",
    adult: "adult",
    elite: "elit",
  }
  const base = stageMap[stage] ?? "baby"
  return `/assets/guto/3d/guto_${base}${isSuper ? "_super" : ""}.glb`
}

// ── Cena interna (roda dentro do Canvas) ──────────────────────────────────────
interface SceneProps {
  url: string
  getTilt?: () => { x: number; y: number }
  getSquish?: () => number
}

function GutoScene({ url, getTilt, getSquish }: SceneProps) {
  const { scene: model } = useGLTF(url)
  const groupRef   = useRef<THREE.Group>(null!)
  const eyeLightRef = useRef<THREE.PointLight>(null!)

  // Aplica melhorias PBR nos materiais uma vez ao carregar
  useEffect(() => {
    model.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const mat  = mesh.material as THREE.MeshStandardMaterial
        if (mat && mat.isMeshStandardMaterial) {
          mat.metalness          = 0.42
          mat.roughness          = 0.36
          mat.envMapIntensity    = 1.8
          mat.needsUpdate        = true
        }
        mesh.castShadow    = false
        mesh.receiveShadow = false
      }
    })
  }, [model])

  // Cálculo de bounding box para normalizar posição e escala
  const [modelScale, setModelScale] = useState(1)
  const [modelOffsetY, setModelOffsetY] = useState(0)

  useEffect(() => {
    const box    = new THREE.Box3().setFromObject(model)
    const size   = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    // Normaliza: altura máxima de 2 unidades
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale  = 2.0 / maxDim
    setModelScale(scale)
    // Centraliza verticalmente
    setModelOffsetY(-center.y * scale)
  }, [model])

  // Spring manual para squish (evita import pesado)
  const currentScale = useRef(1)
  const squishVel    = useRef(0)
  const SPRING_K     = 280
  const SPRING_D     = 22

  // Tilt smooth
  const currentTiltX = useRef(0)
  const currentTiltY = useRef(0)

  // Blink state
  const nextBlinkTime = useRef(Math.random() * 3 + 2)
  const blinkProgress = useRef(0)
  const isBlinking    = useRef(false)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    // ── Float + breathe ───────────────────────────────────────────────────────
    const floatY = Math.sin(t * 0.7) * 0.04
    const floatZ = Math.sin(t * 0.4) * 0.01

    // ── Tilt suave (lerp toward target) ───────────────────────────────────────
    // Lê callbacks a cada frame — zero re-renders do React
    const tilt = getTilt?.() ?? { x: 0, y: 0 }
    currentTiltX.current += (tilt.x * (Math.PI / 180) - currentTiltX.current) * Math.min(1, delta * 8)
    currentTiltY.current += (tilt.y * (Math.PI / 180) - currentTiltY.current) * Math.min(1, delta * 8)

    // ── Squish spring ─────────────────────────────────────────────────────────
    const squishScale = getSquish?.() ?? 1
    const squishError = squishScale - currentScale.current
    squishVel.current += (squishError * SPRING_K - squishVel.current * SPRING_D) * delta
    currentScale.current += squishVel.current * delta

    // ── Gentle idle rotation ──────────────────────────────────────────────────
    const idleY = Math.sin(t * 0.25) * 0.06

    groupRef.current.rotation.x = currentTiltX.current
    groupRef.current.rotation.y = currentTiltY.current + idleY
    groupRef.current.position.y = floatY + modelOffsetY
    groupRef.current.position.z = floatZ
    groupRef.current.scale.setScalar(modelScale * currentScale.current)

    // ── Eye light pulse (simula vida nos olhos) ───────────────────────────────
    if (eyeLightRef.current) {
      const pulse = 0.6 + Math.sin(t * 1.8) * 0.4
      eyeLightRef.current.intensity = pulse * 1.4

      // Blink simulation: luz corta brevemente a cada 3-6s
      if (!isBlinking.current && t > nextBlinkTime.current) {
        isBlinking.current = true
        blinkProgress.current = 0
      }
      if (isBlinking.current) {
        blinkProgress.current += delta * 14
        // 0→1→0 em ~140ms
        const bp = blinkProgress.current
        const blink = bp < 1 ? bp : Math.max(0, 2 - bp)
        eyeLightRef.current.intensity = (1 - blink) * pulse * 1.4
        if (bp > 2) {
          isBlinking.current = false
          nextBlinkTime.current = t + Math.random() * 4 + 2
        }
      }
    }
  })

  return (
    <>
      {/* ── Iluminação rig premium ─────────────────────────────────────────── */}
      {/* Ambiente suave */}
      <ambientLight intensity={0.55} color="#e8f0ff" />

      {/* Key light (principal, quente) */}
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.6}
        color="#ffffff"
      />

      {/* Fill light (suave, lateral) */}
      <directionalLight
        position={[-4, 2, 1]}
        intensity={0.45}
        color="#cce8ff"
      />

      {/* Rim light ciano — identidade GUTO */}
      <directionalLight
        position={[-2, -1, -3]}
        intensity={1.1}
        color="#52e7ff"
      />

      {/* Back light leve */}
      <directionalLight
        position={[0, -3, -5]}
        intensity={0.3}
        color="#a0c8ff"
      />

      {/* Eye glow point light — posição estimada da cabeça */}
      <pointLight
        ref={eyeLightRef}
        position={[0, 0.35, 0.7]}
        intensity={1.2}
        color="#52e7ff"
        distance={1.4}
        decay={2}
      />

      {/* ── Modelo ──────────────────────────────────────────────────────────── */}
      <group ref={groupRef} scale={modelScale}>
        <primitive object={model} />
      </group>
    </>
  )
}

// ── Fallback enquanto carrega ─────────────────────────────────────────────────
function LoadingFallback() {
  return null
}

// ── Componente principal exportado ───────────────────────────────────────────
export function Guto3DAvatar({
  stage = "baby",
  isSuperMode = false,
  getTilt,
  getSquish,
  className,
}: Guto3DAvatarProps) {
  const url = modelUrl(stage, isSuperMode)

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <Canvas
        style={{ background: "transparent" }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0.1, 2.8], fov: 42 }}
        dpr={[1, Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 2, 2)]}
      >
        <Suspense fallback={<LoadingFallback />}>
          <GutoScene
            url={url}
            getTilt={getTilt}
            getSquish={getSquish}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Preload dos modelos para carregamento instantâneo
export function preloadGutoModels(stages: EvolutionStage[] = ["baby", "teen", "adult", "elite"]) {
  for (const stage of stages) {
    for (const isSuper of [false, true]) {
      useGLTF.preload(modelUrl(stage, isSuper))
    }
  }
}
