# Pokémon Champions — Team Lab

Lab de equipos VGC para **Regulation M-B** (Pokémon Champions): caja PC, equipos, wishlist y datos del pool legal.

## Web en vivo

Tras el primer deploy en GitHub Pages:

**https://supermegatron.github.io/PokemonChampions/**

## Desarrollo local

```bash
cd web
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## Publicar cambios

1. Haz commit y push a `main`.
2. GitHub Actions construye y despliega solo.
3. Tus colegas recargan la URL y tienen la versión nueva.

Los datos personales (equipos, caja, wishlist) se guardan en el navegador de cada uno (`localStorage`).

## Estructura

- `web/` — app React (Vite)
- `data/M-B/` — pool, equipos, traducciones
- `scripts/` — scrapers y generadores de datos
- `documentacion/` — notas del proyecto
