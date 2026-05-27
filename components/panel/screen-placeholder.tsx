"use client"

import { Card } from "./atoms"
import { usePanelI18n } from "@/lib/panel/i18n"
import { T } from "@/lib/panel/tokens"
import { usePanelViewport } from "@/hooks/use-panel-viewport"

interface ScreenPlaceholderProps {
  titleKey: string
  subtitleKey: string
  /** Optional descriptive copy shown inside the dashed area. */
  description?: string
}

const DEFAULT_DESCRIPTION =
  "Tela em construção. A fundação visual do painel já está pronta e responsiva — esta tela específica entra nas próximas fases."

export function ScreenPlaceholder({ titleKey, subtitleKey, description }: ScreenPlaceholderProps) {
  const { t } = usePanelI18n()
  const { isMobile, isTablet } = usePanelViewport()
  const screenPad = isMobile ? "20px 14px" : isTablet ? "24px 22px" : "28px 32px"

  return (
    <div style={{ padding: screenPad }}>
      <Card padded>
        <div
          style={{
            fontFamily: T.ui,
            fontSize: 14,
            fontWeight: 600,
            color: T.fg,
            marginBottom: 6,
          }}
        >
          {t(titleKey)}
        </div>
        <div style={{ fontFamily: T.ui, fontSize: 13, color: T.fg3 }}>{t(subtitleKey)}</div>
        <div
          style={{
            marginTop: 22,
            padding: "20px 22px",
            background: T.surfaceAlt,
            border: `1px dashed ${T.borderStrong}`,
            borderRadius: 10,
            color: T.fg3,
            fontFamily: T.ui,
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          {description ?? DEFAULT_DESCRIPTION}
        </div>
      </Card>
    </div>
  )
}
