"use client"

import { T } from "@/lib/panel/tokens"

export function EmpresaLoading() {
  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        background: T.bg,
        color: T.fg2,
        fontFamily: T.ui,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #52e7ff 0%, #0891B2 100%)",
            boxShadow: "0 0 20px rgba(82,231,255,0.35)",
          }}
        />
        <div style={{ fontSize: 13, color: T.fg3 }}>Conectando ao Empresa Portal…</div>
      </div>
    </div>
  )
}
