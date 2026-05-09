import { useState } from "react"
import type { FilterTab } from "../_components/utils"

export function useCoachFilters() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterTab>("ativos")
  const [coachFilter, setCoachFilter] = useState("")
  const [genderFilter, setGenderFilter] = useState("")
  const [minAgeFilter, setMinAgeFilter] = useState("")
  const [maxAgeFilter, setMaxAgeFilter] = useState("")
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState("")

  return {
    search, setSearch,
    filter, setFilter,
    coachFilter, setCoachFilter,
    genderFilter, setGenderFilter,
    minAgeFilter, setMinAgeFilter,
    maxAgeFilter, setMaxAgeFilter,
    subscriptionStatusFilter, setSubscriptionStatusFilter,
  }
}

export type CoachFilters = ReturnType<typeof useCoachFilters>
