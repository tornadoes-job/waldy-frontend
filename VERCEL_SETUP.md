## Build Settings

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

## Environment Variables

Ajoutez cette variable d'environnement dans Vercel :

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://votre-backend-render.onrender.com/api/v1` |

Remplacez `votre-backend-render.onrender.com` par l'URL réelle de votre backend Render.

## Rewrites

Le fichier `vercel.json` configure le rewrite des routes SPA (Single Page Application).
