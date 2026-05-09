import { useMemo } from "react"
import type { AuthUser } from "@/lib/api/auth"

export function useAdminPermissions(user: AuthUser | null) {
  return useMemo(() => {
    const isAdmin = user?.role === "admin" || user?.role === "super_admin"
    const isSuperAdmin = user?.role === "super_admin"
    return { isAdmin, isSuperAdmin }
  }, [user?.role])
}
