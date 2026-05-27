"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { T } from "@/lib/panel/tokens"
import { IChevR } from "./icons"

export interface BreadcrumbItem {
  /** Label visível. */
  label: ReactNode
  /** Se presente, vira link (Next Link); senão, vira texto não-clicável. */
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

/**
 * Hierarquia clicável: Empresas › Action Fit › Coach Bruno.
 * O último item é sempre texto fg (não link). Os demais são links se tiverem href.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Hierarquia"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        fontFamily: T.ui,
        fontSize: 12,
        color: T.fg3,
      }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        const isLink = !!item.href && !isLast
        return (
          <span
            key={`${i}-${typeof item.label === "string" ? item.label : i}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {isLink ? (
              <Link
                href={item.href!}
                style={{
                  color: T.fg3,
                  textDecoration: "none",
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                style={{
                  color: isLast ? T.fg : T.fg3,
                  fontWeight: isLast ? 600 : 500,
                  letterSpacing: "-0.005em",
                }}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <IChevR size={11} sw={2} style={{ color: T.fg4, opacity: 0.7 }} />
            )}
          </span>
        )
      })}
    </nav>
  )
}
