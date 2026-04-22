<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16XN5VXU3iK5bMN47UoLqTnWpHGxXyCJU

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
    (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index c5b0cabb83bcdcb3a84c7af7d76d1d00cd470272..5d2e7e0389af38522edce0cc1aeba39cd189ad24 100644
--- a/README.md
+++ b/README.md
@@ -1,20 +1,32 @@
 <div align="center">
 <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
 </div>
 
 # Run and deploy your AI Studio app
 
 This contains everything you need to run your app locally.
 
 View your app in AI Studio: https://ai.studio/apps/drive/16XN5VXU3iK5bMN47UoLqTnWpHGxXyCJU
 
 ## Run Locally
 
 **Prerequisites:**  Node.js
 
 
 1. Install dependencies:
    `npm install`
 2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
 3. Run the app:
    `npm run dev`

## Guia de interface estilo glass/sci‑fi

- Veja `GUIA_ESTILO_GLASS.md` para um estratégia técnica de implementação do modo "Comando de Elite" (WebM alpha, HUD, camadas de vidro e performance 60 FPS).

## Template pronto de `app.tsx`

- Veja `docs/GUTO_APP_TSX_TEMPLATE.md` para copiar e colar um `app.tsx` completo no layout HUD/Comando de Elite.

## Troubleshooting Next + Backend

- Veja `docs/TROUBLESHOOTING_NEXT_BACKEND.md` para corrigir `multer` types, aviso de `baseUrl`, 404 de WebM e warning de root do Turbopack.
 

## Guia de interface estilo glass/sci‑fi

- Veja `GUIA_ESTILO_GLASS.md` para um estratégia técnica de implementação do modo "Comando de Elite" (WebM alpha, HUD, camadas de vidro e performance 60 FPS).

## Template pronto de `app.tsx`

- Veja `docs/GUTO_APP_TSX_TEMPLATE.md` para copiar e colar um `app.tsx` completo no layout HUD/Comando de Elite.