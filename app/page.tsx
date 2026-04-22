import { GutoApp } from "@/components/guto/guto-app"

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const skipIntro = params["skip-intro"] === "1"

  return <GutoApp userName="" language="pt-BR" skipIntro={skipIntro} />
}
