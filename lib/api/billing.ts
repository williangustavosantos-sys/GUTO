import { apiRequest } from "./client"

export type BillingPlan = "monthly" | "annual" | "beta"

export interface BillingStatus {
  active: boolean
  subscriptionStatus: "pending_payment" | "active" | "expired" | "cancelled"
  subscriptionEndsAt: string | null
  paymentStatus: "pending_payment" | "active" | "expired" | "cancelled" | null
  plan: string | null
  hasStripeCustomer: boolean
  hasStripeSubscription: boolean
}

export async function getBillingStatus(): Promise<BillingStatus> {
  return apiRequest<BillingStatus>("/guto/billing/me")
}

export async function createCheckoutSession(plan: BillingPlan): Promise<{ url: string }> {
  return apiRequest<{ url: string }>("/guto/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ plan }),
  })
}

export async function createPortalSession(): Promise<{ url: string }> {
  return apiRequest<{ url: string }>("/guto/billing/portal", { method: "POST" })
}
