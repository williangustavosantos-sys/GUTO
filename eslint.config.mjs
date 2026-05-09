import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Protótipos visuais / referência de design — não fazem parte do app
      // em runtime, não são bundle-ados pelo Next, e usam pseudo-componentes
      // (Plate, Pill, IUsers, etc.) que existem só como sketch.
      "adm/**",
    ],
  },
]

export default eslintConfig
