// Stroked Lucide-style icons used across the panel surfaces.
// 24×24 viewBox, currentColor stroke, 1.75 default stroke-width.

import type { ReactNode, SVGProps } from "react"

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children" | "d"> {
  size?: number
  sw?: number
}

function SI({ d, size = 18, sw = 1.75, ...rest }: IconProps & { d: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {d}
    </svg>
  )
}

export const IZap = (p: IconProps) => <SI d={<polygon points="13 2 3 14 12 14 11 22 21 10 12 10" />} {...p} />
export const IUsers = (p: IconProps) => (
  <SI
    d={
      <g>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 21a7 7 0 0 1 14 0" />
        <path d="M16 4a4 4 0 0 1 0 8" />
        <path d="M22 21a7 7 0 0 0-5-6.7" />
      </g>
    }
    {...p}
  />
)
export const IUser = (p: IconProps) => (
  <SI
    d={
      <g>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </g>
    }
    {...p}
  />
)
export const IDumbbell = (p: IconProps) => (
  <SI
    d={
      <g>
        <path d="M14.4 14.4 9.6 9.6" />
        <path d="M18.6 21.5a2 2 0 1 1-2.8-2.8M14 19.4l5.4-5.4M5.4 2.5a2 2 0 1 1 2.8 2.8M10 4.6 4.6 10M21.5 21.5l-1.4-1.4M3.9 3.9 2.5 2.5M6.4 12.8a2 2 0 1 1-2.8-2.8M5.3 7.4a2 2 0 1 1-2.8-2.8" />
      </g>
    }
    {...p}
  />
)
export const IFork = (p: IconProps) => (
  <SI
    d={
      <g>
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7" />
      </g>
    }
    {...p}
  />
)
export const ITrend = (p: IconProps) => (
  <SI
    d={
      <g>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </g>
    }
    {...p}
  />
)
export const IShield = (p: IconProps) => <SI d={<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z" />} {...p} />
export const IBuilding = (p: IconProps) => (
  <SI
    d={
      <g>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </g>
    }
    {...p}
  />
)
export const ILog = (p: IconProps) => (
  <SI
    d={
      <g>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 13h10M7 17h6" />
      </g>
    }
    {...p}
  />
)
export const IChevL = (p: IconProps) => <SI d={<polyline points="15 18 9 12 15 6" />} {...p} />
export const IChevR = (p: IconProps) => <SI d={<polyline points="9 6 15 12 9 18" />} {...p} />
export const IChevD = (p: IconProps) => <SI d={<polyline points="6 9 12 15 18 9" />} {...p} />
export const IPlus = (p: IconProps) => (
  <SI
    d={
      <g>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </g>
    }
    {...p}
  />
)
export const IX = (p: IconProps) => (
  <SI
    d={
      <g>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </g>
    }
    {...p}
  />
)
export const ICheck = (p: IconProps) => <SI d={<polyline points="20 6 9 17 4 12" />} {...p} />
export const IGavel = (p: IconProps) => (
  <SI
    d={
      <g>
        <path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10" />
        <path d="m16 16 6-6" />
        <path d="m8 8 6-6" />
        <path d="m9 7 8 8" />
        <path d="m21 11-8-8" />
      </g>
    }
    {...p}
  />
)
export const ISearch = (p: IconProps) => (
  <SI
    d={
      <g>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </g>
    }
    {...p}
  />
)
export const IMenu = (p: IconProps) => (
  <SI
    d={
      <g>
        <path d="M3 12h18M3 6h18M3 18h18" />
      </g>
    }
    {...p}
  />
)
export const IBell = (p: IconProps) => (
  <SI
    d={
      <g>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </g>
    }
    {...p}
  />
)
