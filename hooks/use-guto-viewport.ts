"use client"

import { useEffect, type RefObject } from "react"

/**
 * Mantém as CSS vars do GUTO (`--guto-viewport-height`, `--guto-viewport-width`,
 * `--guto-keyboard-offset`) e o atributo `data-keyboard-open` sincronizados com
 * o `visualViewport` do dispositivo. Usado em rotas fora do `<GutoApp>`
 * (ex.: /login, /convite) para que o teclado iOS não esconda os inputs.
 *
 * Espelha o mesmo contrato aplicado em `components/guto/guto-app.tsx`.
 */
export function useGutoViewport(
  shellRef: RefObject<HTMLElement | null>,
  onKeyboardChange?: (open: boolean) => void
) {
  useEffect(() => {
    const shell = shellRef.current
    if (!shell || typeof window === "undefined") return

    let frame = 0
    let lastKeyboardOpen = false

    const syncViewport = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const visualViewport = window.visualViewport
        const viewportHeight = Math.max(320, Math.round(visualViewport?.height ?? window.innerHeight))
        const viewportWidth = Math.round(visualViewport?.width ?? window.innerWidth)
        const offsetTop = Math.max(0, Math.round(visualViewport?.offsetTop ?? 0))
        const keyboardOffset = Math.max(0, Math.round(window.innerHeight - viewportHeight - offsetTop))
        const activeElement = document.activeElement
        const isTextInput =
          activeElement instanceof HTMLElement &&
          activeElement.matches("input, textarea, [contenteditable='true']")
        const keyboardOpen = isTextInput && (keyboardOffset > 60 || window.innerHeight - viewportHeight > 60)

        const viewportHeightValue = keyboardOpen ? `${viewportHeight}px` : "100dvh"
        shell.style.setProperty("--guto-viewport-height", viewportHeightValue)
        shell.style.setProperty("--guto-viewport-width", `${viewportWidth}px`)
        shell.style.setProperty("--guto-keyboard-offset", `${keyboardOffset}px`)
        shell.toggleAttribute("data-keyboard-open", keyboardOpen)

        const root = document.documentElement
        root.style.setProperty("--guto-viewport-height", viewportHeightValue)
        root.style.setProperty("--guto-viewport-width", `${viewportWidth}px`)
        root.style.setProperty("--guto-keyboard-offset", `${keyboardOffset}px`)
        root.toggleAttribute("data-keyboard-open", keyboardOpen)

        if (keyboardOpen !== lastKeyboardOpen) {
          lastKeyboardOpen = keyboardOpen
          onKeyboardChange?.(keyboardOpen)
        }
      })
    }

    syncViewport()
    window.addEventListener("resize", syncViewport)
    window.addEventListener("orientationchange", syncViewport)
    window.addEventListener("focusin", syncViewport)
    window.addEventListener("focusout", syncViewport)
    window.visualViewport?.addEventListener("resize", syncViewport)
    window.visualViewport?.addEventListener("scroll", syncViewport)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", syncViewport)
      window.removeEventListener("orientationchange", syncViewport)
      window.removeEventListener("focusin", syncViewport)
      window.removeEventListener("focusout", syncViewport)
      window.visualViewport?.removeEventListener("resize", syncViewport)
      window.visualViewport?.removeEventListener("scroll", syncViewport)
      const root = document.documentElement
      root.style.removeProperty("--guto-viewport-height")
      root.style.removeProperty("--guto-viewport-width")
      root.style.removeProperty("--guto-keyboard-offset")
      root.removeAttribute("data-keyboard-open")
    }
  }, [shellRef, onKeyboardChange])
}
