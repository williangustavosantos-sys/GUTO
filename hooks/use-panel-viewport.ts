"use client"

import { useEffect, useState } from "react"

// Breakpoints chosen for the panel UX (not Tailwind's defaults):
//   < 768  → mobile        (sidebar = overlay drawer, single-column content)
//   768–1023 → tablet      (sidebar = overlay drawer, multi-column content allowed)
//   ≥ 1024 → desktop       (sidebar inline, full grids)
const MOBILE_MAX = 767
const TABLET_MAX = 1023

export type PanelBreakpoint = "mobile" | "tablet" | "desktop"

export interface PanelViewport {
  width: number
  breakpoint: PanelBreakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  /** Sidebar should render as an overlay drawer (true on mobile + tablet). */
  isOverlaySidebar: boolean
}

// SSR and first client render share this default so React hydration matches.
// The real viewport is computed once mounted via the effect below.
const SSR_DEFAULT: PanelViewport = {
  width: 1280,
  breakpoint: "desktop",
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isOverlaySidebar: false,
}

function readViewport(): PanelViewport {
  if (typeof window === "undefined") return SSR_DEFAULT
  const width = window.innerWidth
  const isMobile = width <= MOBILE_MAX
  const isTablet = width > MOBILE_MAX && width <= TABLET_MAX
  const isDesktop = width > TABLET_MAX
  return {
    width,
    breakpoint: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
    isMobile,
    isTablet,
    isDesktop,
    isOverlaySidebar: !isDesktop,
  }
}

export function usePanelViewport(): PanelViewport {
  // IMPORTANT: do not call readViewport() in the initializer — that diverges
  // between server (window=undefined → desktop) and client (real width) and
  // produces a React hydration mismatch. Start from the SSR default on every
  // render and let the mount effect upgrade to the real measurement.
  const [vp, setVp] = useState<PanelViewport>(SSR_DEFAULT)

  useEffect(() => {
    setVp(readViewport())
    function onResize() {
      setVp(readViewport())
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return vp
}
